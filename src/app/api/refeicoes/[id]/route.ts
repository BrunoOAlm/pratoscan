import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TipoRefeicao } from "@prisma/client";

const TIPOS: TipoRefeicao[] = ["CAFE", "ALMOCO", "JANTAR", "LANCHE"];

// O filtro { id, userId } nas queries garante que um usuário nunca alcança
// refeição de outro: se o id existir mas for de outra conta, vira 404.

// DELETE /api/refeicoes/[id] — exclui a refeição (itens caem junto via cascade)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const resultado = await prisma.meal.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (resultado.count === 0) {
    return NextResponse.json({ erro: "Refeição não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// PATCH /api/refeicoes/[id] — edita o tipo da refeição (café/almoço/jantar/lanche)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { tipo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  if (!TIPOS.includes(body.tipo as TipoRefeicao)) {
    return NextResponse.json({ erro: "Tipo de refeição inválido." }, { status: 400 });
  }

  const { id } = await params;
  const resultado = await prisma.meal.updateMany({
    where: { id, userId: session.user.id },
    data: { tipo: body.tipo as TipoRefeicao },
  });
  if (resultado.count === 0) {
    return NextResponse.json({ erro: "Refeição não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
