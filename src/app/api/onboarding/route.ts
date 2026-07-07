import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularMetaCalorias, type DadosOnboarding } from "@/lib/tmb";
import type { NivelAtividade, Objetivo, Sexo } from "@prisma/client";

const SEXOS: Sexo[] = ["MASCULINO", "FEMININO"];
const NIVEIS: NivelAtividade[] = ["SEDENTARIO", "LEVE", "MODERADO", "ATIVO", "MUITO_ATIVO"];
const OBJETIVOS: Objetivo[] = ["PERDER", "MANTER", "GANHAR"];

// POST /api/onboarding — salva os dados do wizard e calcula a meta calórica.
// O cálculo acontece AQUI (servidor), nunca no client: o client poderia ser
// adulterado e o valor salvo é a fonte de verdade do app inteiro.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: Partial<DadosOnboarding>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const peso = Number(body.peso);
  const altura = Number(body.altura);
  const idade = Number(body.idade);

  // Validação com faixas fisiologicamente plausíveis — pega tanto erro de
  // digitação (700 kg) quanto unidade errada (1.75 em vez de 175 cm)
  if (!Number.isFinite(peso) || peso < 25 || peso > 400) {
    return NextResponse.json({ erro: "Peso deve estar entre 25 e 400 kg." }, { status: 400 });
  }
  if (!Number.isFinite(altura) || altura < 100 || altura > 250) {
    return NextResponse.json({ erro: "Altura deve estar entre 100 e 250 cm." }, { status: 400 });
  }
  if (!Number.isInteger(idade) || idade < 12 || idade > 120) {
    return NextResponse.json({ erro: "Idade deve estar entre 12 e 120 anos." }, { status: 400 });
  }
  if (!body.sexo || !SEXOS.includes(body.sexo)) {
    return NextResponse.json({ erro: "Sexo inválido." }, { status: 400 });
  }
  if (!body.nivelAtividade || !NIVEIS.includes(body.nivelAtividade)) {
    return NextResponse.json({ erro: "Nível de atividade inválido." }, { status: 400 });
  }
  if (!body.objetivo || !OBJETIVOS.includes(body.objetivo)) {
    return NextResponse.json({ erro: "Objetivo inválido." }, { status: 400 });
  }

  const dados: DadosOnboarding = {
    peso,
    altura,
    idade,
    sexo: body.sexo,
    nivelAtividade: body.nivelAtividade,
    objetivo: body.objetivo,
  };

  const metaCalorias = calcularMetaCalorias(dados);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...dados, metaCalorias },
  });

  return NextResponse.json({ metaCalorias });
}
