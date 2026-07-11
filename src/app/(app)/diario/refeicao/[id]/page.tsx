import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { horarioNoBrasil } from "@/lib/datas";
import DetalheRefeicao from "@/components/DetalheRefeicao";

// Detalhe de uma refeição: busca no servidor (com checagem de dono — refeição
// de outro usuário vira 404) e delega as ações de edição ao client component.
export default async function RefeicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const refeicao = await prisma.meal.findUnique({
    where: { id, userId: session!.user.id },
    select: {
      id: true,
      tipo: true,
      dataHora: true,
      totalCalorias: true,
      totalProteina: true,
      totalCarbo: true,
      totalGordura: true,
      itens: {
        select: {
          id: true,
          nome: true,
          porcao: true,
          calorias: true,
          proteina: true,
          carbo: true,
          gordura: true,
          origem: true,
        },
      },
    },
  });
  if (!refeicao) notFound();

  // A data (YYYY-MM-DD no fuso do Brasil) leva o "voltar" pro dia certo do diário
  const dataDiario = refeicao.dataHora.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  return (
    <DetalheRefeicao
      refeicao={{
        id: refeicao.id,
        tipo: refeicao.tipo,
        horario: horarioNoBrasil(refeicao.dataHora),
        dataDiario,
        totais: {
          calorias: refeicao.totalCalorias,
          proteina: refeicao.totalProteina,
          carbo: refeicao.totalCarbo,
          gordura: refeicao.totalGordura,
        },
        itens: refeicao.itens,
      }}
    />
  );
}
