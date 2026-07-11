"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { comprimirImagem } from "@/lib/imagem";
import { consumirFotoPendente, EVENTO_FOTO_PENDENTE } from "@/lib/foto-pendente";

// ============================================================================
// Fluxo completo do scan em 3 fases:
//   captura    → botão de câmera abre a galeria/câmera do celular
//   analisando → foto comprimida vai para POST /api/scan (a espera de alguns
//                segundos é o momento-chave de UX — loading caprichado)
//   resultado  → cards editáveis; ao salvar, POST /api/refeicoes e volta ao diário
// ============================================================================

type TipoRefeicao = "CAFE" | "ALMOCO" | "JANTAR" | "LANCHE";

interface ItemScan {
  nome: string;
  porcao: string;
  calorias: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

// Item na tela de resultado: guarda os valores BASE retornados pela IA e um
// multiplicador de porção — os macros exibidos/salvos são base × multiplicador,
// então ajustar o stepper nunca acumula erro de arredondamento.
interface ItemAjustavel {
  id: number;
  base: ItemScan;
  multiplicador: number;
  origem: "SCAN" | "MANUAL";
}

const TIPOS: { valor: TipoRefeicao; rotulo: string; emoji: string }[] = [
  { valor: "CAFE", rotulo: "Café", emoji: "☕" },
  { valor: "ALMOCO", rotulo: "Almoço", emoji: "🍛" },
  { valor: "JANTAR", rotulo: "Jantar", emoji: "🌙" },
  { valor: "LANCHE", rotulo: "Lanche", emoji: "🍎" },
];

// Chute inicial do tipo pela hora do dia — o usuário pode trocar na tela
function tipoPorHorario(): TipoRefeicao {
  const h = new Date().getHours();
  if (h >= 5 && h <= 10) return "CAFE";
  if (h >= 11 && h <= 14) return "ALMOCO";
  if (h >= 18 && h <= 23) return "JANTAR";
  return "LANCHE";
}

const MENSAGENS_LOADING = [
  "Analisando seu prato...",
  "Identificando os alimentos...",
  "Estimando as porções...",
  "Calculando calorias e macros...",
];

export default function ScanFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fase, setFase] = useState<"captura" | "analisando" | "resultado">("captura");
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemAjustavel[]>([]);
  const [tipo, setTipo] = useState<TipoRefeicao>(tipoPorHorario);
  const [salvando, setSalvando] = useState(false);
  const proximoId = useRef(1);

  // useCallback com deps vazias: a função só usa setters e refs (estáveis),
  // e precisa de identidade fixa para o efeito da foto pendente abaixo
  const analisarFoto = useCallback(async (arquivo: File) => {
    setErro(null);
    setFase("analisando");
    try {
      const { base64, mediaType } = await comprimirImagem(arquivo);
      const resposta = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: base64, mediaType }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        throw new Error(corpo?.erro ?? "Não foi possível analisar a foto. Tente novamente.");
      }
      setItens(
        (corpo.alimentos as ItemScan[]).map((base) => ({
          id: proximoId.current++,
          base,
          multiplicador: 1,
          origem: "SCAN" as const,
        })),
      );
      setFase("resultado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");
      setFase("captura");
    } finally {
      // Permite escolher o MESMO arquivo de novo (onChange não dispara se o valor não muda)
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  // Foto vinda do botão da bottom nav: consome ao montar (navegou até aqui
  // com a foto já tirada) e escuta o evento (já estava nesta tela)
  useEffect(() => {
    const tentar = () => {
      const foto = consumirFotoPendente();
      if (foto) analisarFoto(foto);
    };
    tentar();
    window.addEventListener(EVENTO_FOTO_PENDENTE, tentar);
    return () => window.removeEventListener(EVENTO_FOTO_PENDENTE, tentar);
  }, [analisarFoto]);

  function ajustarMultiplicador(id: number, delta: number) {
    setItens((atual) =>
      atual.map((item) => {
        if (item.id !== id) return item;
        const m = Math.min(10, Math.max(0.5, item.multiplicador + delta));
        return { ...item, multiplicador: m };
      }),
    );
  }

  function removerItem(id: number) {
    setItens((atual) => atual.filter((i) => i.id !== id));
  }

  function adicionarManual(item: ItemScan) {
    setItens((atual) => [
      ...atual,
      { id: proximoId.current++, base: item, multiplicador: 1, origem: "MANUAL" as const },
    ]);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const resposta = await fetch("/api/refeicoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        itens: itens.map((i) => ({
          nome: i.base.nome,
          porcao:
            i.multiplicador === 1 ? i.base.porcao : `${i.base.porcao} ×${formatarMult(i.multiplicador)}`,
          calorias: i.base.calorias * i.multiplicador,
          proteina: i.base.proteina * i.multiplicador,
          carbo: i.base.carbo * i.multiplicador,
          gordura: i.base.gordura * i.multiplicador,
          origem: i.origem,
        })),
      }),
    });
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => null);
      setErro(corpo?.erro ?? "Não foi possível salvar. Tente novamente.");
      setSalvando(false);
      return;
    }
    router.push("/diario");
    router.refresh();
  }

  const totalCalorias = Math.round(
    itens.reduce((acc, i) => acc + i.base.calorias * i.multiplicador, 0),
  );

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      {/* capture="environment" abre direto a câmera traseira no celular */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) analisarFoto(arquivo);
        }}
      />

      <AnimatePresence mode="wait">
        {fase === "captura" && (
          <motion.div
            key="captura"
            className="flex flex-1 flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              {/* Halo pulsante convida ao toque — o momento-chave do app */}
              <motion.span
                className="absolute inset-0 rounded-full bg-orange-500/20"
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => inputRef.current?.click()}
                className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-500 text-6xl shadow-xl shadow-orange-500/30"
                aria-label="Fotografar prato"
              >
                📷
              </motion.button>
            </div>
            <h1 className="mt-8 text-2xl font-bold">Fotografe seu prato</h1>
            <p className="mt-2 max-w-xs text-zinc-500">
              A IA identifica os alimentos e estima calorias e macros. Você revisa antes de salvar.
            </p>
            {erro && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {erro}
              </motion.p>
            )}
          </motion.div>
        )}

        {fase === "analisando" && <TelaAnalisando key="analisando" />}

        {fase === "resultado" && (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-2xl font-bold tracking-tight">Encontrei isto 🍽️</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Ajuste as porções ou remova o que não estiver certo.
            </p>

            {/* Tipo de refeição */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`rounded-xl border px-1 py-2 text-center text-xs font-medium transition-colors ${
                    tipo === t.valor
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 shadow-[0_0_14px_rgba(16,185,129,0.15)]"
                      : "border-zinc-200 bg-white text-zinc-500"
                  }`}
                >
                  <span className="block text-base">{t.emoji}</span>
                  {t.rotulo}
                </button>
              ))}
            </div>

            {/* Cards dos alimentos */}
            <div className="mt-4 flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {itens.map((item) => (
                  <CardAlimento
                    key={item.id}
                    item={item}
                    aoAjustar={(d) => ajustarMultiplicador(item.id, d)}
                    aoRemover={() => removerItem(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            <FormAdicionarManual aoAdicionar={adicionarManual} />

            {/* Total + salvar */}
            <div className="mt-6 flex items-baseline justify-between">
              <span className="text-zinc-500">Total da refeição</span>
              <span className="text-2xl font-bold text-emerald-600">
                {totalCalorias.toLocaleString("pt-BR")}{" "}
                <span className="text-sm font-medium text-zinc-400">kcal</span>
              </span>
            </div>

            {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

            <button
              className="botao-primario mt-4"
              onClick={salvar}
              disabled={salvando || itens.length === 0}
            >
              {salvando ? "Salvando..." : "Salvar no diário ✅"}
            </button>
            <button
              className="botao-secundario mt-3"
              type="button"
              disabled={salvando}
              onClick={() => {
                setItens([]);
                setErro(null);
                setFase("captura");
              }}
            >
              Tentar outra foto
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// --- Telas e componentes internos --------------------------------------------

function TelaAnalisando() {
  const [indice, setIndice] = useState(0);

  // Troca a mensagem a cada 2.5s para a espera parecer progresso, não travamento
  useEffect(() => {
    const timer = setInterval(
      () => setIndice((i) => Math.min(i + 1, MENSAGENS_LOADING.length - 1)),
      2500,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Anel girando */}
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        />
        <motion.span
          className="text-5xl"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          🍽️
        </motion.span>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={indice}
          className="mt-8 text-lg font-semibold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {MENSAGENS_LOADING[indice]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-2 text-sm text-zinc-400">Isso leva alguns segundos</p>
    </motion.div>
  );
}

function formatarMult(m: number): string {
  return m.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function CardAlimento(props: {
  item: ItemAjustavel;
  aoAjustar: (delta: number) => void;
  aoRemover: () => void;
}) {
  const { base, multiplicador, origem } = props.item;
  const kcal = Math.round(base.calorias * multiplicador);
  const g = (v: number) => (v * multiplicador).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: -12 }}
      className="cartao-item overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {base.nome}
            {origem === "MANUAL" && (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                manual
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-500">{base.porcao}</p>
        </div>
        <button
          type="button"
          onClick={props.aoRemover}
          className="shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:text-red-500"
          aria-label={`Remover ${base.nome}`}
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {/* Stepper de porção: −/+ em passos de 0.5× */}
        <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1">
          <button
            type="button"
            onClick={() => props.aoAjustar(-0.5)}
            className="h-7 w-7 rounded-full text-lg leading-none text-zinc-600 active:bg-zinc-200"
            aria-label="Diminuir porção"
          >
            −
          </button>
          <span className="min-w-9 text-center text-sm font-semibold">
            ×{formatarMult(multiplicador)}
          </span>
          <button
            type="button"
            onClick={() => props.aoAjustar(0.5)}
            className="h-7 w-7 rounded-full text-lg leading-none text-zinc-600 active:bg-zinc-200"
            aria-label="Aumentar porção"
          >
            +
          </button>
        </div>
        <p className="text-lg font-bold text-emerald-600">
          {kcal.toLocaleString("pt-BR")} <span className="text-xs font-medium text-zinc-400">kcal</span>
        </p>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        P {g(base.proteina)}g · C {g(base.carbo)}g · G {g(base.gordura)}g
      </p>
    </motion.div>
  );
}

function FormAdicionarManual(props: { aoAdicionar: (item: ItemScan) => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [porcao, setPorcao] = useState("");
  const [calorias, setCalorias] = useState("");
  const [proteina, setProteina] = useState("");
  const [carbo, setCarbo] = useState("");
  const [gordura, setGordura] = useState("");
  const [estimando, setEstimando] = useState(false);
  const [erroEstimativa, setErroEstimativa] = useState<string | null>(null);

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const valido = nome.trim().length > 0 && num(calorias) !== null;
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

  function adicionar() {
    if (!valido) return;
    props.aoAdicionar({
      nome: nome.trim(),
      porcao: porcao.trim() || "1 porção",
      calorias: num(calorias)!,
      // Macros são opcionais no formulário — vazio conta como 0
      proteina: num(proteina) ?? 0,
      carbo: num(carbo) ?? 0,
      gordura: num(gordura) ?? 0,
    });
    setNome("");
    setPorcao("");
    setCalorias("");
    setProteina("");
    setCarbo("");
    setGordura("");
    setErroEstimativa(null);
    setAberto(false);
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
          Adicionar
        </button>
      </div>
    </motion.div>
  );
}
