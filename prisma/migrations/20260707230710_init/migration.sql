-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO');

-- CreateEnum
CREATE TYPE "NivelAtividade" AS ENUM ('SEDENTARIO', 'LEVE', 'MODERADO', 'ATIVO', 'MUITO_ATIVO');

-- CreateEnum
CREATE TYPE "Objetivo" AS ENUM ('PERDER', 'MANTER', 'GANHAR');

-- CreateEnum
CREATE TYPE "TipoRefeicao" AS ENUM ('CAFE', 'ALMOCO', 'JANTAR', 'LANCHE');

-- CreateEnum
CREATE TYPE "OrigemAlimento" AS ENUM ('SCAN', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "idade" INTEGER,
    "sexo" "Sexo",
    "nivelAtividade" "NivelAtividade",
    "objetivo" "Objetivo",
    "metaCalorias" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoRefeicao" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCalorias" DOUBLE PRECISION NOT NULL,
    "totalProteina" DOUBLE PRECISION NOT NULL,
    "totalCarbo" DOUBLE PRECISION NOT NULL,
    "totalGordura" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "porcao" TEXT NOT NULL,
    "calorias" DOUBLE PRECISION NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL,
    "carbo" DOUBLE PRECISION NOT NULL,
    "gordura" DOUBLE PRECISION NOT NULL,
    "origem" "OrigemAlimento" NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Meal_userId_dataHora_idx" ON "Meal"("userId", "dataHora");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
