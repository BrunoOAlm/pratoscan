# 🍽️ PratoScan

![CI](https://github.com/BrunoOAlm/pratoscan/actions/workflows/ci.yml/badge.svg)

**🌐 App no ar: [pratoscan.vercel.app](https://pratoscan.vercel.app)** — abra no celular e instale na tela inicial.

**Contagem de calorias por foto.** Fotografe seu prato, a IA identifica os alimentos, estima porções, calorias e macros — e tudo vai para um diário comparado com a sua meta calórica pessoal.

App mobile-first em português (pt-BR), pensado para o contexto brasileiro: a IA é instruída a reconhecer arroz, feijão, farofa, pão francês e a descrever porções em medidas caseiras ("4 colheres de sopa"), com valores baseados na Tabela TACO.

## ✨ Como funciona

1. **Onboarding** — um wizard animado coleta peso, altura, idade, sexo, nível de atividade e objetivo. O servidor calcula a TMB com a fórmula **Mifflin-St Jeor**, aplica o fator de atividade e ajusta pelo objetivo (perder −500 kcal / ganhar +300 kcal) para definir a meta diária.
2. **Scan** — a foto é comprimida no client (~1024px) e enviada ao backend, que chama a **API do Gemini** com visão + saída estruturada. A resposta volta como JSON validado com Zod: cada alimento com porção, calorias e macros. Também dá pra digitar o alimento ("pão com requeijão") e a IA estima os valores.
3. **Revisão** — antes de salvar, o usuário ajusta porções com um stepper (recalcula tudo proporcionalmente), remove itens errados ou adiciona alimentos manualmente.
4. **Diário** — as refeições ficam registradas por dia, comparadas com a meta de calorias e a distribuição de macros (30% proteína / 40% carbo / 30% gordura).

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) + TypeScript — frontend e API juntos |
| UI | Tailwind CSS + Framer Motion (tema claro esmeralda/laranja, mobile-first) |
| Banco | PostgreSQL no [Neon](https://neon.tech) via Prisma (connection pooling) |
| Auth | Auth.js (NextAuth v5) com credentials + sessão JWT |
| IA de visão | API do Gemini (saída estruturada validada com Zod) — tier gratuito |
| CI/CD | GitHub Actions (lint, typecheck, build) + deploy automático na [Vercel](https://vercel.com) |

## 🔒 Decisões de engenharia

- **A chave da IA nunca chega ao client** — a chamada ao Gemini acontece só em Route Handler no servidor.
- **O servidor é a fonte de verdade** — totais da refeição e meta calórica são sempre recalculados no backend; o client só exibe. Todo payload passa por validação com faixas de sanidade (pega tanto request adulterado quanto estimativa absurda da IA).
- **Custo controlado** — a foto é redimensionada e re-encodada como JPEG no client antes do upload (menos tokens de visão, menos banda em 4G) e é processada e descartada: nenhuma imagem é armazenada.
- **Resposta da IA validada, não confiada** — schema Zod na saída estruturada; se a foto não for comida, o modelo sinaliza e o app responde com erro amigável em vez de inventar dados.

## 🚀 Rodando localmente

Pré-requisitos: Node 22+, um banco Postgres no [Neon](https://neon.tech) (plano gratuito) e uma chave gratuita da [API do Gemini](https://aistudio.google.com/apikey) (sem cartão de crédito).

```bash
git clone https://github.com/BrunoOAlm/pratoscan.git
cd pratoscan
npm install

# Configure as variáveis de ambiente
cp .env.example .env   # e preencha os valores

# Aplica o schema no banco e gera o Prisma Client
npx prisma migrate dev

npm run dev
```

Abra `http://localhost:3000` — ou acesse pelo celular no IP da sua máquina na rede local para testar a câmera de verdade.

## 🎮 Gamificação

Tudo derivado dos dados das refeições — nenhum contador armazenado, nada de trapaça:

- **Mascote estilo tamagotchi** (SVG próprio, interativo): 6 animais pra escolher, 5 estágios de evolução (Bebê → Lendário), com progresso guardado **por animal** — trocar de bicho não perde nada.
- **Guarda-roupa** desbloqueado por conquistas (chapéu de chef, óculos, medalha...), com validação anti-cheat no servidor.
- 🔥 Streak de dias, ⭐ XP por refeição, 🏆 6 conquistas, 📊 gráfico semanal e 🎉 celebração ao bater a meta.

## 🗺️ Roadmap

- [x] **Fase A** — Auth (e-mail/senha), onboarding em wizard, cálculo da meta calórica
- [x] **Fase B** — Scan por foto com IA, tela de resultado com ajuste manual, estimativa por texto
- [x] **Fase C** — Diário do dia: anel de progresso, barras de macros, navegação entre dias, editar/excluir refeições, completar refeição salva
- [x] **Fase D** — PWA completo (manifest, service worker, prompt de instalação, ícones da logo)
- [x] **Pós-MVP** — Gamificação com mascote, redesign claro esmeralda/laranja, gráfico semanal, deploy na Vercel
- [ ] **Próximos** — Edição de perfil com recálculo da meta, histórico mensal, compartilhar conquistas

---

Projeto de estudo construído em pair programming com IA, com foco em aprender Next.js full-stack, integração com LLMs de visão e boas práticas de validação client/servidor.
