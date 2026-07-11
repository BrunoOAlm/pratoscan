// ============================================================================
// Datas do diário.
//
// O banco guarda dataHora em UTC, mas o "dia" do usuário segue o fuso do
// Brasil. Usamos America/Sao_Paulo com offset FIXO de -03:00 — o Brasil
// aboliu o horário de verão em 2019, então o offset não varia no ano.
// (Se o app um dia atender outros fusos, isso vira preferência do usuário.)
// ============================================================================

const OFFSET_BRASIL = "-03:00";

/** Data (YYYY-MM-DD) de "agora" no fuso do Brasil. */
export function hojeNoBrasil(): string {
  // en-CA formata como YYYY-MM-DD, que é o formato usado na URL (?data=...)
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** True se a string é uma data válida no formato YYYY-MM-DD. */
export function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(`${data}T00:00:00Z`);
  // Rejeita datas impossíveis tipo 2026-02-31 (o Date "corrige" para março)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(data);
}

/** Intervalo [início, fim) do dia brasileiro, em UTC — para filtrar no Prisma. */
export function intervaloDoDia(data: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${data}T00:00:00${OFFSET_BRASIL}`);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fim };
}

/** Soma `dias` (pode ser negativo) a uma data YYYY-MM-DD. */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`); // meio-dia evita qualquer borda de fuso
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Rótulo amigável do dia: "Hoje", "Ontem" ou "ter, 8 de julho". */
export function rotuloDoDia(data: string): string {
  const hoje = hojeNoBrasil();
  if (data === hoje) return "Hoje";
  if (data === somarDias(hoje, -1)) return "Ontem";
  return new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Horário HH:mm de um instante UTC, no fuso do Brasil. */
export function horarioNoBrasil(instante: Date): string {
  return instante.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
