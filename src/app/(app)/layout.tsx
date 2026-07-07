import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";

// Layout de todas as telas logadas (Diário, Scan, Perfil).
// Funciona como "porteiro" duplo:
//   1. sem sessão            → /login
//   2. sem meta calculada    → /onboarding (usuário abandonou o wizard no meio)
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaCalorias: true },
  });
  // Cookie válido mas usuário apagado do banco → trata como deslogado
  if (!user) redirect("/login");
  if (user.metaCalorias == null) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* pb-24 reserva espaço para a bottom nav fixa não cobrir o conteúdo */}
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
