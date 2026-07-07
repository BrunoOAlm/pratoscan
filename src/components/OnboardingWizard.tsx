"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// ============================================================================
// Wizard de onboarding em passos.
//
// Cada passo edita um campo do estado `dados`. No último passo enviamos tudo
// para POST /api/onboarding, que valida, calcula a meta (Mifflin-St Jeor) e
// salva no banco — o client só exibe o resultado.
// ============================================================================

type Sexo = "MASCULINO" | "FEMININO";
type NivelAtividade = "SEDENTARIO" | "LEVE" | "MODERADO" | "ATIVO" | "MUITO_ATIVO";
type Objetivo = "PERDER" | "MANTER" | "GANHAR";

interface Dados {
  peso: string;
  altura: string;
  idade: string;
  sexo: Sexo | null;
  nivelAtividade: NivelAtividade | null;
  objetivo: Objetivo | null;
}

const PASSOS = ["peso", "altura", "idade", "sexo", "atividade", "objetivo"] as const;

const OPCOES_SEXO: { valor: Sexo; rotulo: string; emoji: string }[] = [
  { valor: "MASCULINO", rotulo: "Masculino", emoji: "👨" },
  { valor: "FEMININO", rotulo: "Feminino", emoji: "👩" },
];

const OPCOES_ATIVIDADE: { valor: NivelAtividade; rotulo: string; descricao: string }[] = [
  { valor: "SEDENTARIO", rotulo: "Sedentário", descricao: "Pouco ou nenhum exercício" },
  { valor: "LEVE", rotulo: "Leve", descricao: "Exercício leve 1–3x por semana" },
  { valor: "MODERADO", rotulo: "Moderado", descricao: "Exercício moderado 3–5x por semana" },
  { valor: "ATIVO", rotulo: "Ativo", descricao: "Exercício intenso 6–7x por semana" },
  { valor: "MUITO_ATIVO", rotulo: "Muito ativo", descricao: "Treino pesado + trabalho físico" },
];

const OPCOES_OBJETIVO: { valor: Objetivo; rotulo: string; descricao: string; emoji: string }[] = [
  { valor: "PERDER", rotulo: "Perder peso", descricao: "Déficit de 500 kcal por dia", emoji: "📉" },
  { valor: "MANTER", rotulo: "Manter peso", descricao: "Comer o que o corpo gasta", emoji: "⚖️" },
  { valor: "GANHAR", rotulo: "Ganhar peso", descricao: "Superávit de 300 kcal por dia", emoji: "📈" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState(1); // 1 = avançando, -1 = voltando (direção do slide)
  const [dados, setDados] = useState<Dados>({
    peso: "",
    altura: "",
    idade: "",
    sexo: null,
    nivelAtividade: null,
    objetivo: null,
  });
  const [meta, setMeta] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const chave = PASSOS[passo];

  function passoValido(): boolean {
    switch (chave) {
      case "peso": {
        const n = Number(dados.peso);
        return Number.isFinite(n) && n >= 25 && n <= 400;
      }
      case "altura": {
        const n = Number(dados.altura);
        return Number.isFinite(n) && n >= 100 && n <= 250;
      }
      case "idade": {
        const n = Number(dados.idade);
        return Number.isInteger(n) && n >= 12 && n <= 120;
      }
      case "sexo":
        return dados.sexo !== null;
      case "atividade":
        return dados.nivelAtividade !== null;
      case "objetivo":
        return dados.objetivo !== null;
    }
  }

  function avancar() {
    if (!passoValido()) return;
    setDirecao(1);
    if (passo < PASSOS.length - 1) {
      setPasso(passo + 1);
    } else {
      finalizar();
    }
  }

  function voltar() {
    setDirecao(-1);
    setPasso(Math.max(0, passo - 1));
  }

  async function finalizar() {
    setErro(null);
    setEnviando(true);

    const resposta = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        peso: Number(dados.peso),
        altura: Number(dados.altura),
        idade: Number(dados.idade),
        sexo: dados.sexo,
        nivelAtividade: dados.nivelAtividade,
        objetivo: dados.objetivo,
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => null);
      setErro(corpo?.erro ?? "Algo deu errado. Tente novamente.");
      setEnviando(false);
      return;
    }

    const { metaCalorias } = await resposta.json();
    setMeta(metaCalorias);
    setEnviando(false);
  }

  // Tela final: meta calculada
  if (meta !== null) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
        >
          <p className="text-5xl">🎯</p>
          <h1 className="mt-6 text-2xl font-bold">Sua meta diária</h1>
          <p className="mt-4 text-6xl font-bold tracking-tight text-lime-400">
            {meta.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-lg text-zinc-400">kcal por dia</p>
          <p className="mx-auto mt-6 max-w-xs text-sm text-zinc-500">
            Calculada com a fórmula Mifflin-St Jeor a partir dos seus dados. Você
            pode ajustar seus dados no Perfil quando quiser.
          </p>
          <button
            className="botao-primario mt-10"
            onClick={() => {
              router.push("/diario");
              router.refresh();
            }}
          >
            Começar 🚀
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
      {/* Barra de progresso */}
      <div className="flex items-center gap-3">
        {passo > 0 && (
          <button onClick={voltar} className="text-2xl text-zinc-400" aria-label="Voltar">
            ←
          </button>
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-lime-400"
            animate={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-zinc-500">
          {passo + 1}/{PASSOS.length}
        </span>
      </div>

      {/* Conteúdo do passo com transição de slide */}
      <div className="relative mt-10 flex-1">
        <AnimatePresence mode="wait" custom={direcao}>
          <motion.div
            key={chave}
            custom={direcao}
            initial={{ opacity: 0, x: direcao * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direcao * -60 }}
            transition={{ duration: 0.25 }}
          >
            {chave === "peso" && (
              <CampoNumerico
                titulo="Qual é o seu peso?"
                sufixo="kg"
                valor={dados.peso}
                aoMudar={(v) => setDados({ ...dados, peso: v })}
                aoConfirmar={avancar}
                inputMode="decimal"
                placeholder="70"
              />
            )}
            {chave === "altura" && (
              <CampoNumerico
                titulo="E a sua altura?"
                sufixo="cm"
                valor={dados.altura}
                aoMudar={(v) => setDados({ ...dados, altura: v })}
                aoConfirmar={avancar}
                inputMode="numeric"
                placeholder="170"
              />
            )}
            {chave === "idade" && (
              <CampoNumerico
                titulo="Quantos anos você tem?"
                sufixo="anos"
                valor={dados.idade}
                aoMudar={(v) => setDados({ ...dados, idade: v })}
                aoConfirmar={avancar}
                inputMode="numeric"
                placeholder="30"
              />
            )}
            {chave === "sexo" && (
              <div>
                <Titulo texto="Qual é o seu sexo?" subtitulo="Usado na fórmula do gasto calórico" />
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {OPCOES_SEXO.map((op) => (
                    <CartaoOpcao
                      key={op.valor}
                      selecionado={dados.sexo === op.valor}
                      onClick={() => setDados({ ...dados, sexo: op.valor })}
                    >
                      <span className="text-3xl">{op.emoji}</span>
                      <span className="mt-2 block font-semibold">{op.rotulo}</span>
                    </CartaoOpcao>
                  ))}
                </div>
              </div>
            )}
            {chave === "atividade" && (
              <div>
                <Titulo texto="Como é a sua rotina?" subtitulo="Nível de atividade física" />
                <div className="mt-8 flex flex-col gap-3">
                  {OPCOES_ATIVIDADE.map((op) => (
                    <CartaoOpcao
                      key={op.valor}
                      selecionado={dados.nivelAtividade === op.valor}
                      onClick={() => setDados({ ...dados, nivelAtividade: op.valor })}
                    >
                      <span className="block font-semibold">{op.rotulo}</span>
                      <span className="mt-0.5 block text-sm text-zinc-400">{op.descricao}</span>
                    </CartaoOpcao>
                  ))}
                </div>
              </div>
            )}
            {chave === "objetivo" && (
              <div>
                <Titulo texto="Qual é o seu objetivo?" subtitulo="Isso define sua meta de calorias" />
                <div className="mt-8 flex flex-col gap-3">
                  {OPCOES_OBJETIVO.map((op) => (
                    <CartaoOpcao
                      key={op.valor}
                      selecionado={dados.objetivo === op.valor}
                      onClick={() => setDados({ ...dados, objetivo: op.valor })}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{op.emoji}</span>
                        <div>
                          <span className="block font-semibold">{op.rotulo}</span>
                          <span className="mt-0.5 block text-sm text-zinc-400">{op.descricao}</span>
                        </div>
                      </div>
                    </CartaoOpcao>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {erro && <p className="mb-3 text-sm text-red-400">{erro}</p>}

      <button className="botao-primario" onClick={avancar} disabled={!passoValido() || enviando}>
        {enviando
          ? "Calculando sua meta..."
          : passo === PASSOS.length - 1
            ? "Calcular minha meta ✨"
            : "Continuar"}
      </button>
    </main>
  );
}

// --- Componentes internos do wizard -----------------------------------------

function Titulo({ texto, subtitulo }: { texto: string; subtitulo?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{texto}</h1>
      {subtitulo && <p className="mt-1 text-zinc-400">{subtitulo}</p>}
    </div>
  );
}

function CampoNumerico(props: {
  titulo: string;
  sufixo: string;
  valor: string;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  aoMudar: (v: string) => void;
  aoConfirmar: () => void;
}) {
  return (
    <div>
      <Titulo texto={props.titulo} />
      <div className="mt-8 flex items-end gap-3">
        <input
          className="campo !text-4xl !font-bold tracking-tight"
          type="text"
          inputMode={props.inputMode}
          placeholder={props.placeholder}
          value={props.valor}
          onChange={(e) => props.aoMudar(e.target.value.replace(",", "."))}
          onKeyDown={(e) => e.key === "Enter" && props.aoConfirmar()}
          autoFocus
        />
        <span className="pb-4 text-lg text-zinc-400">{props.sufixo}</span>
      </div>
    </div>
  );
}

function CartaoOpcao(props: {
  selecionado: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={props.onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        props.selecionado
          ? "border-lime-400 bg-lime-400/10"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      {props.children}
    </motion.button>
  );
}
