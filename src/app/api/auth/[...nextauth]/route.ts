// Rota "catch-all" do NextAuth: /api/auth/signin, /api/auth/signout,
// /api/auth/session etc. são todas atendidas pelos handlers exportados aqui.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
