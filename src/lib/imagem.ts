// ============================================================================
// Compressão de foto no CLIENT antes do upload para /api/scan.
//
// Por que comprimir aqui e não no servidor?
//   1. Tokens: a API da Anthropic cobra por tamanho de imagem — ~1024px no
//      maior lado é o suficiente para identificar os alimentos.
//   2. Rede: foto de celular moderno tem 5–15 MB; comprimida vira ~100–300 KB,
//      o que importa muito em 4G.
// ============================================================================

const LADO_MAXIMO = 1024;
const QUALIDADE_JPEG = 0.8;

export interface ImagemComprimida {
  base64: string; // sem o prefixo "data:image/jpeg;base64,"
  mediaType: "image/jpeg";
}

export async function comprimirImagem(arquivo: File): Promise<ImagemComprimida> {
  // createImageBitmap decodifica a foto fora da main thread e já respeita a
  // orientação EXIF (fotos de celular em retrato chegariam deitadas sem isso).
  const bitmap = await createImageBitmap(arquivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado neste navegador.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  // Sempre re-encoda como JPEG: normaliza HEIC/PNG/WebP e aplica a compressão
  const dataUrl = canvas.toDataURL("image/jpeg", QUALIDADE_JPEG);
  return {
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mediaType: "image/jpeg",
  };
}
