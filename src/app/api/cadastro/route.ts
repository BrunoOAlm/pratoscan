import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/cadastro — cria a conta (só e-mail + senha; o resto vem no onboarding)
export async function POST(request: Request) {
  let body: { nome?: string; email?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const nome = body.nome?.trim();
  const email = body.email?.toLowerCase().trim();
  const senha = body.senha;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const jaExiste = await prisma.user.findUnique({ where: { email } });
  if (jaExiste) {
    return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // O custo 10 do bcrypt é o equilíbrio padrão entre segurança e tempo de hash
  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.user.create({
    data: { email, senhaHash, nome: nome || null },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
