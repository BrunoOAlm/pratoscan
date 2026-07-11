import Image from "next/image";

// ============================================================================
// Fundo das telas de login/cadastro: mosaico de fotos de comida de verdade
// (Unsplash, licença livre) com um véu branco por cima — as fotos dão fome,
// o véu garante a leitura do formulário.
// ============================================================================

const TOTAL_FOTOS = 8;
const CELULAS = 36; // sobra pra cobrir telas altas em qualquer breakpoint

export default function MosaicoDeComida() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: CELULAS }, (_, i) => (
          <div key={i} className="aspect-square">
            {/* passo 3 embaralha a sequência: vizinhos (lado e coluna) nunca
                repetem a mesma foto em nenhum dos breakpoints */}
            <Image
              src={`/fotos-login/comida-${((i * 3) % TOTAL_FOTOS) + 1}.webp`}
              alt=""
              width={480}
              height={480}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {/* Véu: mais claro no meio pro cartão respirar, fechando nas pontas */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/70" />
    </div>
  );
}
