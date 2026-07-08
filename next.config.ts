import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O dev server bloqueia requisições cross-origin por padrão. Estas origens
  // são liberadas SÓ em desenvolvimento (não afetam produção): o IP da rede
  // local (testar no celular) e os túneis temporários da Cloudflare.
  allowedDevOrigins: ["192.168.1.3", "*.trycloudflare.com"],
};

export default nextConfig;
