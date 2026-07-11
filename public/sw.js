// ============================================================================
// Service worker básico do PratoScan (v1).
//
// Estratégia mínima e segura — modo offline completo está fora do escopo:
//   - assets estáticos do build (/_next/static): cache-first. São imutáveis
//     (o nome do arquivo tem hash), então cache nunca fica obsoleto.
//   - ícones: cache-first, pelo mesmo motivo.
//   - todo o resto (páginas, APIs): direto na rede, sem cache — dados do
//     diário sempre frescos.
// ============================================================================

const CACHE = "pratoscan-estatico-v1";

self.addEventListener("install", () => {
  // Ativa a versão nova do SW imediatamente, sem esperar as abas fecharem
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // Remove caches de versões antigas (quando CACHE mudar de nome)
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);
  const ehEstatico =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"));

  if (!ehEstatico || evento.request.method !== "GET") return; // deixa ir pra rede

  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const emCache = await cache.match(evento.request);
      if (emCache) return emCache;
      const resposta = await fetch(evento.request);
      if (resposta.ok) cache.put(evento.request, resposta.clone());
      return resposta;
    }),
  );
});
