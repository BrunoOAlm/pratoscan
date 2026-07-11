"use client";

import { useEffect } from "react";

// Registra o service worker — só em produção: em dev o cache do SW briga
// com o hot reload e esconde mudanças de código.
export default function RegistroSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Falha no registro não pode quebrar o app — o SW é só melhoria progressiva
    });
  }, []);

  return null;
}
