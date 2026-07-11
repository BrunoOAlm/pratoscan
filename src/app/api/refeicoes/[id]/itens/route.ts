import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/refeicoes/[id]/itens — adiciona um alimento a uma refeição JÁ
// salva (ex.: esqueceu a bebida do lanche e quer completar depois).
// Mesmas faixas de sanidade do POST /api/refeicoes; os totais desnormalizados
// são recalculados na mesma transação — o servidor segue sendo a fonte de verdade.

// Faixas de sanidade — pegam tanto payload adulterado quanto uma estimativa
// absurda da IA que o usuário confirmou sem olhar.
function validarNumero(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 10) / 10;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;
  const userId = session.user.id;

  let body: {
    nome?: unknown;
    porcao?: unknown;
    calorias?: unknown;
    proteina?: unknown;
    carbo?: unknown;
    gordura?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 100) : "";
  const porcao = typeof body.porcao === "string" ? body.porcao.trim().slice(0, 100) : "";
  const calorias = validarNumero(body.calorias, 5000);
  const proteina = validarNumero(body.proteina, 500);
  const carbo = validarNumero(body.carbo, 500);
  const gordura = validarNumero(body.gordura, 500);

  if (!nome || !porcao || calorias === null || proteina === null || carbo === null || gordura === null) {
    return NextResponse.json({ erro: "Item da refeição inválido." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // findFirst com id + dono: refeição de outro usuário vira 404 (não vaza
      // nem a existência do registro)
      const refeicao = await tx.meal.findFirst({
        where: { id, userId },
        select: { _count: { select: { itens: true } } },
      });
      if (!refeicao) throw new Error("NAO_ENCONTRADO");
      // Mesmo limite do POST /api/refeicoes
      if (refeicao._count.itens >= 20) throw new Error("LIMITE_ITENS");

      await tx.foodItem.create({
        data: {
          mealId: id,
          nome,
          porcao,
          calorias,
          proteina,
          carbo,
          gordura,
          origem: "MANUAL", // adicionado na mão (mesmo que a IA tenha estimado os valores)
        },
      });

      // Recalcula os totais a partir de TODOS os itens (nunca soma incremental)
      const itens = await tx.foodItem.findMany({ where: { mealId: id } });
      const soma = (campo: "calorias" | "proteina" | "carbo" | "gordura") =>
        Math.round(itens.reduce((acc, i) => acc + i[campo], 0) * 10) / 10;
      await tx.meal.update({
        where: { id },
        data: {
          totalCalorias: soma("calorias"),
          totalProteina: soma("proteina"),
          totalCarbo: soma("carbo"),
          totalGordura: soma("gordura"),
        },
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "NAO_ENCONTRADO") {
      return NextResponse.json({ erro: "Refeição não encontrada." }, { status: 404 });
    }
    if (e instanceof Error && e.message === "LIMITE_ITENS") {
      return NextResponse.json({ erro: "A refeição já tem 20 itens." }, { status: 400 });
    }
    throw e;
  }
}
