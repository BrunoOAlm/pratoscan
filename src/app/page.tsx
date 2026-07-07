import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Porta de entrada: decide para onde mandar o usuário.
// O gate do onboarding (metaCalorias nula → wizard) fica no layout de (app).
export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/diario" : "/login");
}
