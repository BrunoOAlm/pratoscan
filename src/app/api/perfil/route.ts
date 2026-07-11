import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CORES_MASCOTE } from "@/lib/avatares";

// PATCH /api/perfil — troca a cor do mascote do usuário
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { avatar?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  if (!CORES_MASCOTE.some((c) => c.id === body.avatar)) {
    return NextResponse.json({ erro: "Cor inválida." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: body.avatar as string },
  });
  return NextResponse.json({ ok: true });
}
