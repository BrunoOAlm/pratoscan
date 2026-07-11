"use client";

import { signOut } from "next-auth/react";

export default function BotaoSair() {
  return (
    <button
      className="botao-secundario !text-red-500"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sair da conta
    </button>
  );
}
