import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularMetaMacros } from "@/lib/macros";
import {
  dataValida,
  hojeNoBrasil,
  horarioNoBrasil,
  intervaloDoDia,
  rotuloDoDia,
  somarDias,
} from "@/lib/datas";
import ResumoDia from "@/components/ResumoDia";
import MascoteDoDia from "@/components/MascoteDoDia";
import { calcularStreak, diasComRegistro, progressoDoAnimal } from "@/lib/gamificacao";
import { ANIMAL_PADRAO, animalPorId } from "@/lib/avatares";
import { roupasEquipadas } from "@/lib/roupas";
import type { TipoRefeicao } from "@prisma/client";

// Cada tipo de refeição tem sua cor (referência de design): o tile do emoji
// ganha o tom do tipo, o resto do card fica neutro
const ROTULO_TIPO: Record<TipoRefeicao, { nome: string; emoji: string; tile: string }> = {
  CAFE: { nome: "Café da manhã", emoji: "☕", tile: "border-amber-200 bg-amber-50" },
  ALMOCO: { nome: "Almoço", emoji: "🍛", tile: "border-emerald-200 bg-emerald-50" },
  JANTAR: { nome: "Jantar", emoji: "🌙", tile: "border-indigo-200 bg-indigo-50" },
  LANCHE: { nome: "Lanche", emoji: "🍎", tile: "border-rose-200 bg-rose-50" },
};

// Régua de 7 dias no topo (referência de design): janela deslizante que
// termina no dia selecionado+3, mas nunca mostra o futuro. Tocar nas pontas
// "desliza" a janela — navegação infinita sem estado no client.
function janelaDeDias(selecionado: string, hoje: string): string[] {
  const alvo = somarDias(selecionado, 3);
  const fim = alvo > hoje ? hoje : alvo; // ISO YYYY-MM-DD compara como string
  return Array.from({ length: 7 }, (_, i) => somarDias(fim, i - 6));
}

// Letra do dia da semana (S T Q Q S S D) para a régua
function letraDoDia(data: string): string {
  return new Date(`${data}T12:00:00Z`)
    .toLocaleDateString("pt-BR", { weekday: "narrow", timeZone: "UTC" })
    .toUpperCase();
}

// Diário do dia: anel de progresso, macros e refeições. O dia exibido vem
// de ?data=YYYY-MM-DD (sem o parâmetro, é hoje) — assim cada dia tem URL
// própria e a navegação ←/→ são links simples, sem estado no client.
export default async function DiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const session = await auth();
  const { data: dataParam } = await searchParams;
  const data = dataParam && dataValida(dataParam) ? dataParam : hojeNoBrasil();
  const ehHoje = data === hojeNoBrasil();

  const { inicio, fim } = intervaloDoDia(data);
  // Para o streak bastam as datas dos últimos 90 dias — um streak maior que
  // isso continua contando certo assim que o usuário mantiver o hábito
  const { inicio: inicioStreak } = intervaloDoDia(somarDias(hojeNoBrasil(), -90));
  const [user, refeicoes, datasParaStreak, refeicoesPorMascote] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      select: { metaCalorias: true, nome: true, avatar: true, roupas: true },
    }),
    prisma.meal.findMany({
      where: { userId: session!.user.id, dataHora: { gte: inicio, lt: fim } },
      orderBy: { dataHora: "asc" },
      select: {
        id: true,
        tipo: true,
        dataHora: true,
        totalCalorias: true,
        totalProteina: true,
        totalCarbo: true,
        totalGordura: true,
        _count: { select: { itens: true } },
      },
    }),
    prisma.meal.findMany({
      where: { userId: session!.user.id, dataHora: { gte: inicioStreak } },
      select: { dataHora: true },
    }),
    // XP do animal ativo = refeições registradas "com ele" (coleção)
    prisma.meal.groupBy({
      by: ["mascote"],
      where: { userId: session!.user.id },
      _count: { _all: true },
    }),
  ]);

  const { streak, registrouHoje } = calcularStreak(
    diasComRegistro(datasParaStreak.map((m) => m.dataHora)),
  );

  const animalAtivo = animalPorId(user.avatar);
  // Registros antigos (mascote null) contam para o animal padrão
  const refeicoesDoAtivo = refeicoesPorMascote
    .filter((g) => (g.mascote ?? ANIMAL_PADRAO.id) === animalAtivo.id)
    .reduce((acc, g) => acc + g._count._all, 0);
  const progressoAtivo = progressoDoAnimal(refeicoesDoAtivo);

  const meta = user.metaCalorias!; // garantido pelo gate do layout
  const metaMacros = calcularMetaMacros(meta);
  const soma = (campo: "totalCalorias" | "totalProteina" | "totalCarbo" | "totalGordura") =>
    refeicoes.reduce((acc, r) => acc + r[campo], 0);

  return (
    <main className="px-6 py-8">
      {/* Cabeçalho do dia + streak */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize tracking-tight">{rotuloDoDia(data)}</h1>
          {!ehHoje && (
            <Link href="/diario" className="text-xs font-medium text-emerald-600">
              voltar para hoje →
            </Link>
          )}
        </div>
        {streak > 0 && (
          <Link
            href="/perfil"
            className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-bold tabular-nums text-orange-600"
            aria-label={`Sequência de ${streak} ${streak === 1 ? "dia" : "dias"}`}
          >
            🔥 {streak}
          </Link>
        )}
      </div>

      {/* Régua de dias: tocar nas pontas desliza a janela para navegar */}
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {janelaDeDias(data, hojeNoBrasil()).map((d) => {
          const selecionado = d === data;
          return (
            <Link
              key={d}
              href={`/diario?data=${d}`}
              aria-label={rotuloDoDia(d)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl border py-2 transition active:scale-95 ${
                selecionado
                  ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_14px_rgba(16,185,129,0.15)]"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <span className={`text-[10px] font-medium ${selecionado ? "text-emerald-600" : "text-zinc-400"}`}>
                {letraDoDia(d)}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  selecionado ? "text-emerald-700" : "text-zinc-600"
                }`}
              >
                {Number(d.slice(8))}
              </span>
            </Link>
          );
        })}
      </div>

      {/* A casinha do mascote no dia a dia */}
      <div className="mt-5">
        <MascoteDoDia
          nome={user.nome?.split(" ")[0] ?? null}
          animal={animalAtivo}
          progresso={progressoAtivo}
          roupas={roupasEquipadas(user.roupas)}
          estado={{ registrouHoje, streak }}
        />
      </div>

      <div className="mt-4">
        <ResumoDia
          consumido={soma("totalCalorias")}
          meta={meta}
          macros={{
            proteina: { consumido: soma("totalProteina"), meta: metaMacros.proteinaG },
            carbo: { consumido: soma("totalCarbo"), meta: metaMacros.carboG },
            gordura: { consumido: soma("totalGordura"), meta: metaMacros.gorduraG },
          }}
        />
      </div>

      {/* Refeições do dia */}
      <h2 className="mt-8 text-lg font-bold tracking-tight">Refeições</h2>
      {refeicoes.length === 0 ? (
        <div className="entrada mt-4 rounded-3xl border border-dashed border-zinc-200 p-8 text-center">
          <p className="text-4xl">🍽️</p>
          <p className="mt-3 text-zinc-500">
            {ehHoje ? "Nenhuma refeição registrada hoje." : "Nenhuma refeição neste dia."}
          </p>
          {ehHoje && (
            <Link href="/scan" className="mt-2 inline-block text-sm font-medium text-emerald-600">
              Escanear meu prato →
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {refeicoes.map((r, i) => (
            <li key={r.id} className="entrada" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                href={`/diario/refeicao/${r.id}`}
                className="cartao-item flex items-center gap-4 p-4 transition active:scale-[0.98]"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${ROTULO_TIPO[r.tipo].tile}`}
                >
                  {ROTULO_TIPO[r.tipo].emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{ROTULO_TIPO[r.tipo].nome}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {horarioNoBrasil(r.dataHora)} · {r._count.itens}{" "}
                    {r._count.itens === 1 ? "item" : "itens"}
                  </p>
                </div>
                <p className="shrink-0 font-bold tabular-nums text-emerald-600">
                  {Math.round(r.totalCalorias).toLocaleString("pt-BR")}
                  <span className="ml-1 text-xs font-medium text-zinc-400">kcal</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
