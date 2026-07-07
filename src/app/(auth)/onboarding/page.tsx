import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "@/components/OnboardingWizard";

// Casca em Server Component: garante login e evita refazer o onboarding
// de quem já tem meta calculada. O wizard em si é client (interativo).
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaCalorias: true },
  });
  if (user?.metaCalorias != null) redirect("/diario");

  return <OnboardingWizard />;
}
