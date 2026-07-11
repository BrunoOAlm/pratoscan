import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// ============================================================================
// Cliente compartilhado da API do Gemini (Google AI Studio, tier gratuito).
// Roda SOMENTE no servidor — a chave GEMINI_API_KEY nunca chega ao client.
// Chave gratuita em https://aistudio.google.com/apikey (sem cartão de crédito).
// ============================================================================

// gemini-3.5-flash: multimodal (aceita foto), rápido e "free of charge" no
// tier gratuito (10 req/min, 1.500 req/dia) — de sobra pra uso pessoal.
export const MODELO_GEMINI = "gemini-3.5-flash";

export const gemini = new GoogleGenAI({}); // lê GEMINI_API_KEY do ambiente

// Converte um schema Zod pro formato JSON Schema que o Gemini aceita em
// response_format. O campo $schema (metadado do padrão) é removido porque
// não faz parte do que a API espera.
export function schemaParaGemini(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

// O Gemini devolve a resposta estruturada como TEXTO JSON — aqui a gente
// faz o parse e valida contra o schema Zod. Retorna null se a resposta
// vier vazia ou não bater com o formato esperado (a rota trata como 502).
export function validarResposta<T>(schema: z.ZodType<T>, textoJson: string | undefined): T | null {
  if (!textoJson) return null;
  try {
    const resultado = schema.safeParse(JSON.parse(textoJson));
    return resultado.success ? resultado.data : null;
  } catch {
    return null; // JSON malformado
  }
}
