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
import type { TipoRefeicao } from "@prisma/client";

const ROTULO_TIPO: Record<TipoRefeicao, { nome: string; emoji: string }> = {
  CAFE: { nome: "Café da manhã", emoji: "☕" },
  ALMOCO: { nome: "Almoço", emoji: "🍛" },
  JANTAR: { nome: "Jantar", emoji: "🌙" },
  LANCHE: { nome: "Lanche", emoji: "🍎" },
};

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
  const [user, refeicoes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      select: { metaCalorias: true },
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
  ]);

  const meta = user.metaCalorias!; // garantido pelo gate do layout
  const metaMacros = calcularMetaMacros(meta);
  const soma = (campo: "totalCalorias" | "totalProteina" | "totalCarbo" | "totalGordura") =>
    refeicoes.reduce((acc, r) => acc + r[campo], 0);

  return (
    <main className="px-6 py-8">
      {/* Navegação entre dias */}
      <div className="flex items-center justify-between">
        <Link
          href={`/diario?data=${somarDias(data, -1)}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-lg text-zinc-300"
          aria-label="Dia anterior"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="font-semibold capitalize">{rotuloDoDia(data)}</p>
          {!ehHoje && (
            <Link href="/diario" className="text-xs text-lime-400">
              voltar para hoje
            </Link>
          )}
        </div>
        {/* Não deixa navegar para o futuro: dia sem refeição possível é ruído */}
        {ehHoje ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/40 text-lg text-zinc-700">
            →
          </span>
        ) : (
          <Link
            href={`/diario?data=${somarDias(data, 1)}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-lg text-zinc-300"
            aria-label="Próximo dia"
          >
            →
          </Link>
        )}
      </div>

      <div className="mt-6">
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
      <h2 className="mt-8 text-lg font-bold">Refeições</h2>
      {refeicoes.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-4xl">🍽️</p>
          <p className="mt-3 text-zinc-400">
            {ehHoje ? "Nenhuma refeição registrada hoje." : "Nenhuma refeição neste dia."}
          </p>
          {ehHoje && (
            <Link href="/scan" className="mt-2 inline-block text-sm font-medium text-lime-400">
              Escanear meu prato →
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {refeicoes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/diario/refeicao/${r.id}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
                  {ROTULO_TIPO[r.tipo].emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{ROTULO_TIPO[r.tipo].nome}</p>
                  <p className="text-sm text-zinc-400">
                    {horarioNoBrasil(r.dataHora)} · {r._count.itens}{" "}
                    {r._count.itens === 1 ? "item" : "itens"}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-lime-400">
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
