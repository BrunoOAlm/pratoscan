import type { DefaultSession } from "next-auth";

// Por padrão o NextAuth não expõe o id do usuário na sessão.
// Esta "module augmentation" estende o tipo para incluir `session.user.id`,
// que preenchemos no callback `session` em src/auth.ts.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
