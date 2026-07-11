import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { animalPorId } from "@/lib/avatares";
import type { TipoRefeicao, OrigemAlimento } from "@prisma/client";

const TIPOS: TipoRefeicao[] = ["CAFE", "ALMOCO", "JANTAR", "LANCHE"];
const ORIGENS: OrigemAlimento[] = ["SCAN", "MANUAL"];

interface ItemRecebido {
  nome?: unknown;
  porcao?: unknown;
  calorias?: unknown;
  proteina?: unknown;
  carbo?: unknown;
  gordura?: unknown;
  origem?: unknown;
}

// Faixas de sanidade por item — pegam tanto payload adulterado quanto uma
// estimativa absurda da IA que o usuário confirmou sem olhar.
function validarNumero(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 10) / 10;
}

// POST /api/refeicoes — salva a refeição confirmada pelo usuário após o scan.
// Os totais são calculados AQUI (servidor): o client mostra a soma, mas a
// fonte de verdade é sempre recomputada a partir dos itens.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { tipo?: unknown; itens?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!TIPOS.includes(body.tipo as TipoRefeicao)) {
    return NextResponse.json({ erro: "Tipo de refeição inválido." }, { status: 400 });
  }
  if (!Array.isArray(body.itens) || body.itens.length === 0 || body.itens.length > 20) {
    return NextResponse.json({ erro: "A refeição precisa ter entre 1 e 20 itens." }, { status: 400 });
  }

  interface ItemValidado {
    nome: string;
    porcao: string;
    calorias: number;
    proteina: number;
    carbo: number;
    gordura: number;
    origem: OrigemAlimento;
  }
  const itens: ItemValidado[] = [];
  for (const item of body.itens as ItemRecebido[]) {
    const nome = typeof item.nome === "string" ? item.nome.trim().slice(0, 100) : "";
    const porcao = typeof item.porcao === "string" ? item.porcao.trim().slice(0, 100) : "";
    const calorias = validarNumero(item.calorias, 5000);
    const proteina = validarNumero(item.proteina, 500);
    const carbo = validarNumero(item.carbo, 500);
    const gordura = validarNumero(item.gordura, 500);
    // origem vem do client (SCAN = item identificado na foto, MANUAL = adicionado na mão)
    const origem = ORIGENS.includes(item.origem as OrigemAlimento) ? (item.origem as OrigemAlimento) : null;

    if (!nome || !porcao || calorias === null || proteina === null || carbo === null || gordura === null || origem === null) {
      return NextResponse.json({ erro: "Item da refeição inválido." }, { status: 400 });
    }
    itens.push({ nome, porcao, calorias, proteina, carbo, gordura, origem });
  }

  const soma = (campo: "calorias" | "proteina" | "carbo" | "gordura") =>
    Math.round(itens.reduce((acc, i) => acc + i[campo], 0) * 10) / 10;

  // Carimba o animal-mascote ativo: o XP de cada animal é derivado da
  // contagem de refeições registradas "com ele" (coleção)
  const dono = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });

  const refeicao = await prisma.meal.create({
    data: {
      userId: session.user.id,
      tipo: body.tipo as TipoRefeicao,
      mascote: animalPorId(dono?.avatar).id,
      totalCalorias: soma("calorias"),
      totalProteina: soma("proteina"),
      totalCarbo: soma("carbo"),
      totalGordura: soma("gordura"),
      itens: { create: itens },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: refeicao.id }, { status: 201 });
}
