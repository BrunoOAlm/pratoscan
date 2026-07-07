import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Configuração central do NextAuth (Auth.js v5).
// Estratégia "jwt": a sessão vive num cookie assinado (com AUTH_SECRET),
// sem precisar de tabela de sessões no banco — suficiente para a v1.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        senha: {},
      },
      // Chamado no submit do login: valida e-mail + senha contra o banco.
      // Retornar null = credenciais inválidas (NextAuth devolve erro genérico,
      // sem revelar se o e-mail existe — boa prática de segurança).
      async authorize(credentials) {
        const email = credentials?.email;
        const senha = credentials?.senha;
        if (typeof email !== "string" || typeof senha !== "string") return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!user) return null;

        // Compara a senha digitada com o hash salvo (nunca guardamos a senha em texto)
        const senhaConfere = await bcrypt.compare(senha, user.senhaHash);
        if (!senhaConfere) return null;

        return { id: user.id, email: user.email, name: user.nome };
      },
    }),
  ],
  callbacks: {
    // O objeto `user` só existe no momento do login — copiamos o id para o token JWT...
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // ...e do token para a sessão, para que `session.user.id` esteja disponível
    // em qualquer Server Component ou Route Handler via `await auth()`.
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
