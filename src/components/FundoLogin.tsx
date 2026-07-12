import Image from "next/image";

// ============================================================================
// Fundo das telas de login/cadastro: UMA foto de frutas coloridas cobrindo a
// tela (Unsplash, licença livre) com um véu branco em gradiente — a foto dá
// o clima, o véu e o cartão do formulário garantem a leitura.
// ============================================================================

export default function FundoLogin() {
  return (
    // z-0 (e não -z-10): com z negativo o fundo ficaria atrás do fundo da
    // própria página; o cartão do formulário fica por cima com z-10
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Image
        src="/fotos-login/fundo.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-white/55" />
    </div>
  );
}
