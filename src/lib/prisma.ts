import { PrismaClient } from "@prisma/client";

// Em desenvolvimento, o Next.js recarrega os módulos a cada mudança de código.
// Sem este singleton, cada reload criaria um novo PrismaClient (e uma nova
// conexão com o banco), esgotando o limite de conexões do Neon rapidamente.
// Guardamos a instância em globalThis para sobreviver aos reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
