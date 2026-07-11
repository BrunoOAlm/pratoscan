import { NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { auth } from "@/auth";
import {
  analisarPrato,
  MEDIA_TYPES_ACEITOS,
  type MediaTypeAceito,
} from "@/lib/scan";

// A análise com visão pode levar dezenas de segundos — sem isto a função
// serverless seria encerrada no timeout padrão da plataforma.
export const maxDuration = 60;

// ~4 MB de imagem em base64. O client já comprime para ~1024px/JPEG antes de
// enviar, então na prática as fotos chegam bem menores que isso.
const TAMANHO_MAX_BASE64 = 6_000_000;

// POST /api/scan — recebe a foto do prato e devolve os alimentos identificados.
// O usuário ainda pode revisar/remover itens antes de salvar (POST /api/refeicoes).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { imagem?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const { imagem, mediaType } = body;
  if (typeof imagem !== "string" || imagem.length === 0) {
    return NextResponse.json({ erro: "Foto ausente." }, { status: 400 });
  }
  if (imagem.length > TAMANHO_MAX_BASE64) {
    return NextResponse.json({ erro: "Foto grande demais." }, { status: 413 });
  }
  if (!MEDIA_TYPES_ACEITOS.includes(mediaType as MediaTypeAceito)) {
    return NextResponse.json({ erro: "Formato de imagem não suportado." }, { status: 400 });
  }

  try {
    const analise = await analisarPrato(imagem, mediaType as MediaTypeAceito);

    if (!analise) {
      return NextResponse.json(
        { erro: "Não foi possível analisar a foto. Tente novamente." },
        { status: 502 },
      );
    }
    if (!analise.ehComida || analise.alimentos.length === 0) {
      return NextResponse.json(
        { erro: "Não identifiquei comida nesta foto. Tente outro ângulo, com boa iluminação." },
        { status: 422 },
      );
    }

    return NextResponse.json({ alimentos: analise.alimentos });
  } catch (e) {
    if (e instanceof ApiError) {
      // 429 = limite de requisições do tier gratuito (10/min) — passa em instantes
      if (e.status === 429 || e.status >= 500) {
        return NextResponse.json(
          { erro: "Serviço de análise ocupado. Tente de novo em instantes." },
          { status: 503 },
        );
      }
      console.error("Erro da API Gemini no scan:", e.status, e.message);
      return NextResponse.json(
        { erro: "Não foi possível analisar a foto agora." },
        { status: 502 },
      );
    }
    throw e;
  }
}
