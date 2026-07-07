import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularMetaMacros } from "@/lib/macros";

// Diário — versão da fase (a): mostra a meta calculada para validar o fluxo
// completo (cadastro → onboarding → app). O anel de progresso animado e a
// lista de refeições entram na fase (c).
export default async function DiarioPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { nome: true, metaCalorias: true },
  });

  const meta = user.metaCalorias!; // garantido pelo gate do layout
  const macros = calcularMetaMacros(meta);
  const primeiroNome = user.nome?.split(" ")[0];

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        {primeiroNome ? `Olá, ${primeiroNome}! 👋` : "Olá! 👋"}
      </h1>
      <p className="mt-1 text-zinc-400">Sua meta de hoje</p>

      <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-5xl font-bold tracking-tight text-lime-400">
          {meta.toLocaleString("pt-BR")}
          <span className="ml-2 text-lg font-medium text-zinc-400">kcal</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-zinc-800/60 p-3">
            <p className="text-lg font-semibold">{macros.proteinaG}g</p>
            <p className="text-xs text-zinc-400">Proteína</p>
          </div>
          <div className="rounded-2xl bg-zinc-800/60 p-3">
            <p className="text-lg font-semibold">{macros.carboG}g</p>
            <p className="text-xs text-zinc-400">Carboidrato</p>
          </div>
          <div className="rounded-2xl bg-zinc-800/60 p-3">
            <p className="text-lg font-semibold">{macros.gorduraG}g</p>
            <p className="text-xs text-zinc-400">Gordura</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        O anel de progresso e suas refeições aparecem aqui na fase (c) 🚧
      </p>
    </main>
  );
}
