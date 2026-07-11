import type { MetadataRoute } from "next";

// Manifest do PWA — o Next serve em /manifest.webmanifest e injeta o <link>
// automaticamente. display "standalone" = abre sem a barra do navegador,
// como app nativo, quando instalado na tela inicial.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PratoScan",
    short_name: "PratoScan",
    description: "Fotografe seu prato e acompanhe suas calorias",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icone-192.png",
        sizes: "192x192",
        type: "image/png",
        // A arte respeita a zona segura de 80%, então o mesmo arquivo serve
        // para "any" e para "maskable" (Android recorta em círculo/squircle)
        purpose: "maskable",
      },
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
