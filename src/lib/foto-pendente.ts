// ============================================================================
// "Correio" da foto entre a bottom nav e a tela de scan (client-side).
//
// O navegador só abre a câmera em resposta direta a um toque do usuário, então
// o <input type="file"> precisa estar no botão da bottom nav — não dá para
// navegar até /scan e disparar o input lá programaticamente. A foto escolhida
// fica guardada aqui e o ScanFlow a consome:
//   - ao montar (usuário estava em outra tela e foi navegado para /scan), ou
//   - via evento (usuário já estava em /scan quando tocou no botão).
// ============================================================================

export const EVENTO_FOTO_PENDENTE = "pratoscan:foto-pendente";

let fotoPendente: File | null = null;

export function guardarFotoPendente(foto: File) {
  fotoPendente = foto;
  window.dispatchEvent(new Event(EVENTO_FOTO_PENDENTE));
}

/** Devolve a foto guardada (uma única vez) ou null. */
export function consumirFotoPendente(): File | null {
  const foto = fotoPendente;
  fotoPendente = null;
  return foto;
}
