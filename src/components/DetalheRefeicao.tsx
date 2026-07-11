"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import FormAdicionarAlimento, { type NovoAlimento } from "@/components/FormAdicionarAlimento";

// ============================================================================
// Detalhe da refeição com edição:
//   - trocar o tipo (café/almoço/jantar/lanche)     → PATCH /api/refeicoes/[id]
//   - adicionar um alimento depois de salvar        → POST .../itens
//   - remover um alimento                           → DELETE .../itens/[itemId]
//   - excluir a refeição inteira (com confirmação)  → DELETE /api/refeicoes/[id]
// Após cada ação, router.refresh() re-busca os dados no servidor — o client
// nunca recalcula totais, só exibe o que o backend devolve.
// ============================================================================

type TipoRefeicao = "CAFE" | "ALMOCO" | "JANTAR" | "LANCHE";

const TIPOS: { valor: TipoRefeicao; rotulo: string; emoji: string }[] = [
  { valor: "CAFE", rotulo: "Café", emoji: "☕" },
  { valor: "ALMOCO", rotulo: "Almoço", emoji: "🍛" },
  { valor: "JANTAR", rotulo: "Jantar", emoji: "🌙" },
  { valor: "LANCHE", rotulo: "Lanche", emoji: "🍎" },
];

interface Item {
  id: string;
  nome: string;
  porcao: string;
  calorias: number;
  proteina: number;
  carbo: number;
  gordura: number;
  origem: "SCAN" | "MANUAL";
}

interface Props {
  refeicao: {
    id: string;
    tipo: TipoRefeicao;
    horario: string;
    dataDiario: string; // YYYY-MM-DD para o link de voltar
    totais: { calorias: number; proteina: number; carbo: number; gordura: number };
    itens: Item[];
  };
}

export default function DetalheRefeicao({ refeicao }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const linkVoltar = `/diario?data=${refeicao.dataDiario}`;

  async function chamarApi(url: string, init: RequestInit): Promise<Response | null> {
    setErro(null);
    setOcupado(true);
    try {
      const resposta = await fetch(url, init);
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Algo deu errado. Tente novamente.");
        return null;
      }
      return resposta;
    } catch {
      setErro("Sem conexão. Tente novamente.");
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function trocarTipo(tipo: TipoRefeicao) {
    if (tipo === refeicao.tipo || ocupado) return;
    const ok = await chamarApi(`/api/refeicoes/${refeicao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    });
    if (ok) router.refresh();
  }

  async function removerItem(itemId: string) {
    if (ocupado) return;
    const resposta = await chamarApi(`/api/refeicoes/${refeicao.id}/itens/${itemId}`, {
      method: "DELETE",
    });
    if (!resposta) return;
    const { refeicaoExcluida } = await resposta.json();
    // Removeu o último item → a refeição já não existe, volta pro diário
    if (refeicaoExcluida) {
      router.push(linkVoltar);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  // Adicionar um alimento numa refeição já salva (ex.: esqueceu a bebida).
  // Devolve true pro formulário limpar e fechar só quando o servidor confirmou.
  async function adicionarItem(item: NovoAlimento): Promise<boolean> {
    if (ocupado) return false;
    const ok = await chamarApi(`/api/refeicoes/${refeicao.id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (ok) router.refresh();
    return ok !== null;
  }

  async function excluirRefeicao() {
    // Primeiro toque arma a confirmação; o segundo exclui de verdade
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    const ok = await chamarApi(`/api/refeicoes/${refeicao.id}`, { method: "DELETE" });
    if (ok) {
      router.push(linkVoltar);
      router.refresh();
    }
  }

  const tipoAtual = TIPOS.find((t) => t.valor === refeicao.tipo)!;

  return (
    <main className="px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href={linkVoltar}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-600 transition active:scale-90"
          aria-label="Voltar ao diário"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {tipoAtual.emoji} {tipoAtual.rotulo}
          </h1>
          <p className="text-sm text-zinc-500">às {refeicao.horario}</p>
        </div>
      </div>

      {/* Trocar tipo */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            disabled={ocupado}
            onClick={() => trocarTipo(t.valor)}
            className={`rounded-xl border px-1 py-2 text-center text-xs font-medium transition-colors ${
              refeicao.tipo === t.valor
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 shadow-[0_0_14px_rgba(16,185,129,0.15)]"
                : "border-zinc-200 bg-white text-zinc-500"
            }`}
          >
            <span className="block text-base">{t.emoji}</span>
            {t.rotulo}
          </button>
        ))}
      </div>

      {/* Totais */}
      <div className="cartao-item mt-5 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-zinc-500">Total</span>
          <span className="text-2xl font-bold text-emerald-600">
            {Math.round(refeicao.totais.calorias).toLocaleString("pt-BR")}{" "}
            <span className="text-sm font-medium text-zinc-400">kcal</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          P {formatarG(refeicao.totais.proteina)}g · C {formatarG(refeicao.totais.carbo)}g · G{" "}
          {formatarG(refeicao.totais.gordura)}g
        </p>
      </div>

      {/* Itens */}
      <h2 className="mt-6 text-lg font-bold">Alimentos</h2>
      <div className="mt-3 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {refeicao.itens.map((item) => (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: -12 }}
              className="cartao-item overflow-hidden p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {item.nome}
                    {item.origem === "MANUAL" && (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                        manual
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{item.porcao}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    P {formatarG(item.proteina)}g · C {formatarG(item.carbo)}g · G{" "}
                    {formatarG(item.gordura)}g
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="font-bold text-emerald-600">
                    {Math.round(item.calorias).toLocaleString("pt-BR")}
                    <span className="ml-1 text-xs font-medium text-zinc-400">kcal</span>
                  </p>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => removerItem(item.id)}
                    className="text-xs text-zinc-400 transition-colors hover:text-red-500"
                  >
                    remover
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Esqueceu algo? Dá pra completar a refeição depois de salvar */}
      <FormAdicionarAlimento aoAdicionar={adicionarItem} />

      {erro && <p className="mt-4 text-sm text-red-500">{erro}</p>}

      {/* Excluir refeição (dois toques) */}
      <button
        type="button"
        disabled={ocupado}
        onClick={excluirRefeicao}
        onBlur={() => setConfirmandoExclusao(false)}
        className={`mt-8 w-full rounded-2xl border px-4 py-3.5 text-base font-semibold transition ${
          confirmandoExclusao
            ? "border-red-400 bg-red-50 text-red-600"
            : "border-zinc-200 text-zinc-500"
        }`}
      >
        {confirmandoExclusao ? "Toque de novo para excluir ⚠️" : "Excluir refeição"}
      </button>
    </main>
  );
}

function formatarG(v: number): string {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
