import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ANIMAIS_MASCOTE } from "@/lib/avatares";
import { validarRoupas } from "@/lib/roupas";
import { calcularStreak, diasComRegistro } from "@/lib/gamificacao";

// PATCH /api/perfil — troca o animal-mascote e/ou as roupas equipadas.
// O desbloqueio das roupas é RECOMPUTADO aqui a partir das refeições reais:
// o client mostra o guarda-roupa, mas quem decide se a peça pode ser usada
// é o servidor (é um jogo — sem trapaça).
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { avatar?: unknown; roupas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const dados: { avatar?: string; roupas?: string } = {};

  if (body.avatar !== undefined) {
    if (!ANIMAIS_MASCOTE.some((a) => a.id === body.avatar)) {
      return NextResponse.json({ erro: "Animal inválido." }, { status: 400 });
    }
    dados.avatar = body.avatar as string;
  }

  if (body.roupas !== undefined) {
    const [user, refeicoes] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
        select: { metaCalorias: true },
      }),
      prisma.meal.findMany({
        where: { userId: session.user.id },
        select: { dataHora: true, totalCalorias: true },
      }),
    ]);
    const meta = user.metaCalorias ?? 0;

    const totalPorDia = new Map<string, number>();
    for (const r of refeicoes) {
      const dia = r.dataHora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      totalPorDia.set(dia, (totalPorDia.get(dia) ?? 0) + r.totalCalorias);
    }
    const { streak } = calcularStreak(diasComRegistro(refeicoes.map((r) => r.dataHora)));

    const validas = validarRoupas(body.roupas, {
      totalRefeicoes: refeicoes.length,
      streak,
      bateuMetaAlgumDia:
        meta > 0 && [...totalPorDia.values()].some((kcal) => kcal >= meta * 0.9 && kcal <= meta * 1.1),
    });
    if (validas === null) {
      return NextResponse.json({ erro: "Roupa inválida ou ainda bloqueada." }, { status: 400 });
    }
    dados.roupas = JSON.stringify(validas);
  }

  if (Object.keys(dados).length === 0) {
    return NextResponse.json({ erro: "Nada para atualizar." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: dados });
  return NextResponse.json({ ok: true });
}
