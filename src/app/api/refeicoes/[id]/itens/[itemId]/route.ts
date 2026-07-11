import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/refeicoes/[id]/itens/[itemId] — remove um alimento da refeição.
// Os totais desnormalizados da refeição são recalculados na mesma transação;
// se era o último item, a refeição inteira é excluída (refeição vazia não
// faz sentido no diário).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { id, itemId } = await params;
  const userId = session.user.id;

  try {
    const refeicaoExcluida = await prisma.$transaction(async (tx) => {
      // deleteMany com o filtro completo (item + refeição + dono) em uma query:
      // count 0 = item inexistente OU de outro usuário — os dois viram 404
      const removido = await tx.foodItem.deleteMany({
        where: { id: itemId, meal: { id, userId } },
      });
      if (removido.count === 0) throw new Error("NAO_ENCONTRADO");

      const restantes = await tx.foodItem.findMany({ where: { mealId: id } });
      if (restantes.length === 0) {
        await tx.meal.delete({ where: { id } });
        return true;
      }

      const soma = (campo: "calorias" | "proteina" | "carbo" | "gordura") =>
        Math.round(restantes.reduce((acc, i) => acc + i[campo], 0) * 10) / 10;
      await tx.meal.update({
        where: { id },
        data: {
          totalCalorias: soma("calorias"),
          totalProteina: soma("proteina"),
          totalCarbo: soma("carbo"),
          totalGordura: soma("gordura"),
        },
      });
      return false;
    });

    return NextResponse.json({ refeicaoExcluida });
  } catch (e) {
    if (e instanceof Error && e.message === "NAO_ENCONTRADO") {
      return NextResponse.json({ erro: "Item não encontrado." }, { status: 404 });
    }
    throw e;
  }
}
