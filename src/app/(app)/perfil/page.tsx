import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BotaoSair from "@/components/BotaoSair";

const ROTULO_ATIVIDADE: Record<string, string> = {
  SEDENTARIO: "Sedentário",
  LEVE: "Leve",
  MODERADO: "Moderado",
  ATIVO: "Ativo",
  MUITO_ATIVO: "Muito ativo",
};

const ROTULO_OBJETIVO: Record<string, string> = {
  PERDER: "Perder peso",
  MANTER: "Manter peso",
  GANHAR: "Ganhar peso",
};

// Perfil — versão da fase (a): exibe os dados e permite sair.
// A edição com recálculo da meta entra junto do polish (fase d).
export default async function PerfilPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
  });

  const linhas = [
    ["E-mail", user.email],
    ["Peso", `${user.peso} kg`],
    ["Altura", `${user.altura} cm`],
    ["Idade", `${user.idade} anos`],
    ["Atividade", ROTULO_ATIVIDADE[user.nivelAtividade ?? ""] ?? "—"],
    ["Objetivo", ROTULO_OBJETIVO[user.objetivo ?? ""] ?? "—"],
    ["Meta diária", `${user.metaCalorias?.toLocaleString("pt-BR")} kcal`],
  ];

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        {user.nome ?? "Seu perfil"}
      </h1>
      <p className="mt-1 text-zinc-400">Seus dados</p>

      <div className="cartao mt-6 divide-y divide-white/[0.06]">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-zinc-400">{rotulo}</span>
            <span className="font-medium">{valor}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        Edição dos dados (com recálculo da meta) chega na fase (d) 🚧
      </p>

      <div className="mt-8">
        <BotaoSair />
      </div>
    </main>
  );
}
