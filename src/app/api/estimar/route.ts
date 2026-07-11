import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { estimarAlimento } from "@/lib/estimativa";

// POST /api/estimar — o usuário digita um alimento e a IA estima porção,
// calorias e macros (o formulário permite ajustar antes de adicionar).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: { descricao?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  if (descricao.length < 2 || descricao.length > 120) {
    return NextResponse.json(
      { erro: "Descreva o alimento em 2 a 120 caracteres." },
      { status: 400 },
    );
  }

  try {
    const estimativa = await estimarAlimento(descricao);

    if (!estimativa) {
      return NextResponse.json(
        { erro: "Não foi possível estimar agora. Tente novamente." },
        { status: 502 },
      );
    }
    if (!estimativa.ehAlimento) {
      return NextResponse.json(
        { erro: "Isso não parece ser um alimento. Tente descrever de outro jeito." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      porcao: estimativa.porcao,
      calorias: estimativa.calorias,
      proteina: estimativa.proteina,
      carbo: estimativa.carbo,
      gordura: estimativa.gordura,
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError) {
      return NextResponse.json(
        { erro: "Serviço ocupado. Tente de novo em instantes." },
        { status: 503 },
      );
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Erro da API Anthropic na estimativa:", e.status, e.message);
      return NextResponse.json({ erro: "Não foi possível estimar agora." }, { status: 502 });
    }
    throw e;
  }
}
