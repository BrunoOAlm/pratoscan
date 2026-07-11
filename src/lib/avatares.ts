// Personagens disponíveis para o mascote do perfil.
// Fica fora do route.ts porque rotas só podem exportar handlers HTTP,
// e o client (tela de perfil) também precisa desta lista.
export const AVATARES = ["🐱", "🐶", "🦊", "🐼", "🐸", "🦁", "🐨", "🐷"] as const;
export type Avatar = (typeof AVATARES)[number];
export const AVATAR_PADRAO: Avatar = "🐱";
