import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hojeNoBrasil, rotuloDoDia, somarDias } from "@/lib/datas";
import { montarGamificacao, progressoDoAnimal } from "@/lib/gamificacao";
import { ANIMAIS_MASCOTE, ANIMAL_PADRAO, animalPorId } from "@/lib/avatares";
import PerfilGamificado from "@/components/PerfilGamificado";
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

// Perfil gamificado: mascote, nível/XP, conquistas e gráfico da semana.
// Toda a gamificação é DERIVADA das refeições (ver lib/gamificacao.ts),
// então esta página busca as refeições uma vez e computa tudo aqui.
export default async function PerfilPage() {
  const session = await auth();
  const [user, refeicoes] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } }),
    prisma.meal.findMany({
      where: { userId: session!.user.id },
      select: { dataHora: true, totalCalorias: true, mascote: true },
    }),
  ]);
  const meta = user.metaCalorias!; // garantido pelo gate do layout

  // Total de kcal por dia (fuso do Brasil) — alimenta a conquista de meta e o gráfico
  const totalPorDia = new Map<string, number>();
  for (const r of refeicoes) {
    const dia = r.dataHora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    totalPorDia.set(dia, (totalPorDia.get(dia) ?? 0) + r.totalCalorias);
  }
  const bateuMetaAlgumDia = [...totalPorDia.values()].some(
    (kcal) => kcal >= meta * 0.9 && kcal <= meta * 1.1,
  );

  const gamificacao = montarGamificacao({
    totalRefeicoes: refeicoes.length,
    datasRefeicoes: refeicoes.map((r) => r.dataHora),
    bateuMetaAlgumDia,
  });

  // Coleção: refeições por animal (registros antigos, sem carimbo, contam
  // para o padrão) → progresso individual de cada bicho
  const refeicoesPorAnimal = new Map<string, number>();
  for (const r of refeicoes) {
    const id = r.mascote ?? ANIMAL_PADRAO.id;
    refeicoesPorAnimal.set(id, (refeicoesPorAnimal.get(id) ?? 0) + 1);
  }
  const colecao = ANIMAIS_MASCOTE.map((a) => ({
    animal: a,
    progresso: progressoDoAnimal(refeicoesPorAnimal.get(a.id) ?? 0),
  }));
  const animalAtivo = animalPorId(user.avatar);
  const progressoAtivo = colecao.find((c) => c.animal.id === animalAtivo.id)!.progresso;

  // Últimos 7 dias para o gráfico (do mais antigo até hoje)
  const hoje = hojeNoBrasil();
  const semana = Array.from({ length: 7 }, (_, i) => {
    const dia = somarDias(hoje, i - 6);
    return {
      rotulo: rotuloDoDia(dia),
      letra: new Date(`${dia}T12:00:00Z`)
        .toLocaleDateString("pt-BR", { weekday: "narrow", timeZone: "UTC" })
        .toUpperCase(),
      kcal: Math.round(totalPorDia.get(dia) ?? 0),
    };
  });

  const linhas = [
    ["E-mail", user.email],
    ["Peso", `${user.peso} kg`],
    ["Altura", `${user.altura} cm`],
    ["Idade", `${user.idade} anos`],
    ["Atividade", ROTULO_ATIVIDADE[user.nivelAtividade ?? ""] ?? "—"],
    ["Objetivo", ROTULO_OBJETIVO[user.objetivo ?? ""] ?? "—"],
    ["Meta diária", `${meta.toLocaleString("pt-BR")} kcal`],
  ];

  return (
    <main className="px-6 py-8">
      <PerfilGamificado
        nome={user.nome?.split(" ")[0] ?? null}
        animal={animalAtivo}
        progresso={progressoAtivo}
        colecao={colecao}
        gamificacao={gamificacao}
        semana={semana}
        meta={meta}
      />

      {/* Dados do onboarding */}
      <h2 className="mt-8 text-lg font-bold tracking-tight">Seus dados</h2>
      <div className="cartao mt-3 divide-y divide-zinc-100">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-zinc-500">{rotulo}</span>
            <span className="font-medium">{valor}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <BotaoSair />
      </div>
    </main>
  );
}
