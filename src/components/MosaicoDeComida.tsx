import Image from "next/image";

// ============================================================================
// Fundo das telas de login/cadastro: mosaico de fotos de comida de verdade
// (Unsplash, licença livre) com um véu branco por cima — as fotos dão fome,
// o véu garante a leitura do formulário.
// ============================================================================

const TOTAL_FOTOS = 9;
const CELULAS = 40; // sobra pra cobrir telas altas em qualquer breakpoint

export default function MosaicoDeComida() {
  return (
    // z-0 (e não -z-10): com z negativo o mosaico ficaria atrás do fundo da
    // própria página; o cartão do formulário fica por cima com z-10
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white">
      {/* grid-flow-dense preenche os buracos deixados pelas células grandes */}
      <div className="grid grid-flow-dense grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: CELULAS }, (_, i) => (
          <div
            key={i}
            // A cada 7 células uma ocupa 2x2 — quebra a monotonia do grid e
            // disfarça a repetição das 9 fotos (visual de galeria, não de wallpaper)
            className={`overflow-hidden rounded-xl ${i % 7 === 0 ? "col-span-2 row-span-2" : "aspect-square"}`}
          >
            {/* passo 4 (coprimo de 9) embaralha a sequência: vizinhos nunca
                repetem a mesma foto em nenhum dos breakpoints */}
            <Image
              src={`/fotos-login/comida-${((i * 4) % TOTAL_FOTOS) + 1}.webp`}
              alt=""
              width={480}
              height={480}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {/* Véu leve: mais fechado em cima e embaixo, quase aberto no meio —
          as fotos aparecem vivas e o cartão (branco sólido) cuida da leitura */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/15 to-white/60" />
    </div>
  );
}
