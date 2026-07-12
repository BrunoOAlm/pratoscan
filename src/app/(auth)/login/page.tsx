"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import FundoLogin from "@/components/FundoLogin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    // redirect: false → tratamos o resultado aqui em vez de deixar o
    // NextAuth redirecionar sozinho (para mostrar erro amigável em pt-BR)
    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (resultado?.error) {
      setErro("E-mail ou senha incorretos.");
      setEnviando(false);
      return;
    }

    router.push("/diario");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <FundoLogin />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md sm:p-8"
      >
        <Image
          src="/icons/icone-192.png"
          alt="Logo do PratoScan"
          width={64}
          height={64}
          className="drop-shadow-sm"
          priority
        />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Prato<span className="text-emerald-500">Scan</span>
        </h1>
        <p className="mt-2 text-zinc-500">
          Fotografe seu prato. A gente conta as calorias.
        </p>

        <form onSubmit={entrar} className="mt-8 flex flex-col gap-3">
          <input
            className="campo"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="campo"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <button className="botao-primario mt-2" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-emerald-600">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
