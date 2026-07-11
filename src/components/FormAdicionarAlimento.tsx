"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ============================================================================
// Formulário de adicionar alimento na mão, com o botão "estimar com IA":
// o usuário digita o nome ("200 ml de mate"), a IA preenche porção, calorias
// e macros, e tudo continua editável antes de confirmar.
//
// Usado em dois lugares:
//   - ScanFlow (resultado do scan, antes de salvar)   → aoAdicionar síncrono
//   - DetalheRefeicao (refeição já salva no diário)   → aoAdicionar chama a API
// aoAdicionar devolve true quando deu certo — só aí o formulário limpa e fecha.
// ============================================================================

export interface NovoAlimento {
  nome: string;
  porcao: string;
  calorias: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

interface Props {
  aoAdicionar: (item: NovoAlimento) => boolean | Promise<boolean>;
}

export default function FormAdicionarAlimento({ aoAdicionar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [porcao, setPorcao] = useState("");
  const [calorias, setCalorias] = useState("");
  const [proteina, setProteina] = useState("");
  const [carbo, setCarbo] = useState("");
  const [gordura, setGordura] = useState("");
  const [estimando, setEstimando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEstimativa, setErroEstimativa] = useState<string | null>(null);

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const valido = nome.trim().length > 0 && num(calorias) !== null && !enviando;
  const formatarNum = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  // Digite o alimento → a IA preenche porção, calorias e macros (editáveis)
  async function estimarComIA() {
    if (nome.trim().length < 2 || estimando) return;
    setErroEstimativa(null);
    setEstimando(true);
    try {
      const resposta = await fetch("/api/estimar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: nome.trim() }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroEstimativa(corpo?.erro ?? "Não foi possível estimar. Tente novamente.");
        return;
      }
      setPorcao(corpo.porcao);
      setCalorias(formatarNum(corpo.calorias));
      setProteina(formatarNum(corpo.proteina));
      setCarbo(formatarNum(corpo.carbo));
      setGordura(formatarNum(corpo.gordura));
    } catch {
      setErroEstimativa("Sem conexão. Tente novamente.");
    } finally {
      setEstimando(false);
    }
  }

  async function adicionar() {
    if (!valido) return;
    setEnviando(true);
    try {
      const deuCerto = await aoAdicionar({
        nome: nome.trim(),
        porcao: porcao.trim() || "1 porção",
        calorias: num(calorias)!,
        // Macros são opcionais no formulário — vazio conta como 0
        proteina: num(proteina) ?? 0,
        carbo: num(carbo) ?? 0,
        gordura: num(gordura) ?? 0,
      });
      if (!deuCerto) return; // quem chamou já mostrou o erro — mantém preenchido
      setNome("");
      setPorcao("");
      setCalorias("");
      setProteina("");
      setCarbo("");
      setGordura("");
      setErroEstimativa(null);
      setAberto(false);
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-3 w-full rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400"
      >
        + Adicionar alimento manualmente
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="cartao-item mt-3 overflow-hidden p-4"
    >
      <p className="font-semibold">Adicionar alimento</p>
      <div className="mt-3 flex flex-col gap-2">
        <input
          className="campo !py-2.5 text-sm"
          placeholder="Alimento (ex.: pão com requeijão)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && estimarComIA()}
        />
        {/* A IA estima porção/kcal/macros a partir do nome — tudo editável depois */}
        <button
          type="button"
          disabled={nome.trim().length < 2 || estimando}
          onClick={estimarComIA}
          className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition active:scale-[0.98] disabled:opacity-50"
        >
          {estimando ? "Estimando... 🤔" : "✨ Estimar calorias com IA"}
        </button>
        {erroEstimativa && <p className="text-xs text-red-500">{erroEstimativa}</p>}
        <input
          className="campo !py-2.5 text-sm"
          placeholder="Porção (ex.: 2 fatias)"
          value={porcao}
          onChange={(e) => setPorcao(e.target.value)}
        />
        <input
          className="campo !py-2.5 text-sm"
          placeholder="Calorias (kcal)"
          inputMode="decimal"
          value={calorias}
          onChange={(e) => setCalorias(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="campo !py-2.5 text-sm"
            placeholder="Prot. (g)"
            inputMode="decimal"
            value={proteina}
            onChange={(e) => setProteina(e.target.value)}
          />
          <input
            className="campo !py-2.5 text-sm"
            placeholder="Carbo (g)"
            inputMode="decimal"
            value={carbo}
            onChange={(e) => setCarbo(e.target.value)}
          />
          <input
            className="campo !py-2.5 text-sm"
            placeholder="Gord. (g)"
            inputMode="decimal"
            value={gordura}
            onChange={(e) => setGordura(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="botao-secundario !py-2.5 text-sm"
          onClick={() => setAberto(false)}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="botao-primario !py-2.5 text-sm"
          disabled={!valido}
          onClick={adicionar}
        >
          {enviando ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </motion.div>
  );
}
