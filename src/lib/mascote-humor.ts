// Humor e falas do mascote — compartilhado entre o perfil e o card do diário.
import type { HumorMascote } from "@/components/Mascote";

export interface EstadoMascote {
  registrouHoje: boolean;
  streak: number;
}

export function humorDoMascote(e: EstadoMascote): HumorMascote {
  if (!e.registrouHoje) return "faminto";
  if (e.streak >= 3) return "empolgado";
  return "feliz";
}

// Falas por estado — uma aleatória a cada toque
export function falasDoMascote(e: EstadoMascote, nome: string | null, estagioNome: string): string[] {
  const oi = nome ?? "você";
  if (estagioNome === "Bebê") {
    return [
      "Sou só um bebê... me alimenta direitinho! 🍼",
      "Registra refeições que eu cresço rapidinho 🌱",
      `Cuida de mim, ${oi}! 🥺`,
    ];
  }
  if (!e.registrouHoje) {
    return [
      "Tô com fome... registra uma refeição! 🍽️",
      "Nada no diário hoje ainda 👀",
      `Bora fotografar o prato, ${oi}? 📷`,
      "Me alimenta que eu cresço! 🌱",
    ];
  }
  if (e.streak >= 7) {
    return [
      `${e.streak} dias seguidos, que orgulho! 🚀`,
      "A gente tá imparável! 🔥",
      "Olha o tamanho que eu tô ficando! 💪",
    ];
  }
  if (e.streak >= 3) {
    return [`${e.streak} dias de sequência! 🔥`, "Tamo pegando fogo! 🔥", "Continua assim que eu cresço! 🌱"];
  }
  return ["Registrou hoje, mandou bem! ✅", "Tamo juntos nessa! 💪", "Cada refeição me deixa mais forte 🌱"];
}

export function falaAleatoria(e: EstadoMascote, nome: string | null, estagioNome: string): string {
  const falas = falasDoMascote(e, nome, estagioNome);
  return falas[Math.floor(Math.random() * falas.length)];
}
