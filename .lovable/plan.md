
## Objetivo

Criar uma nova visualização estilo Miro — **Value Ladder** — em formato de escada (canvas com eixos PREÇO ↑ e VALOR →), onde os produtos atuais aparecem como cards verdes agrupados em "post-its" amarelos por categoria, exatamente no estilo das duas imagens enviadas.

Manter o Kanban atual intacto e adicionar a Value Ladder como uma **segunda visualização** acessível por toggle no header (Kanban / Value Ladder) ou rota separada.

## Estrutura visual (igual às referências)

- Fundo branco com **grid pontilhado/quadriculado** sutil
- Eixo Y rotulado **PREÇO** (seta para cima), eixo X rotulado **VALOR** (seta para a direita)
- Título no topo (ex: "Value Ladder B2B | O2 Inc." e "Value Ladder B2C | Oxy Hacker")
- Cada **degrau** = um grupo (post-it amarelo grande) contendo:
  - Label do grupo em negrito acima (ex: "FREE CONTENT", "MARKETING ENGINEERING", "Education", "SAAS", "Assessoria Financeira", "Special Situations", "Micro Franquia", "Franquia & Master")
  - Tickets/preços pequenos no topo de cada card (ex: "12×397", "R$ 140.000")
  - Cards verdes com nome do produto (mesmos dados do Kanban)
- Posicionamento em escada: cada grupo mais à direita está mais acima (preço/valor crescentes)

## Duas ladders

Conforme as imagens:
1. **B2B | O2 Inc.** — Free Content → Marketing Engineering → SAAS (Oxy, Oxy+Gênio, Gestão 5.0) → Assessoria Financeira (Board, CFOaaS, Full Finance) → Special Situations (Turnaround, M&A, Fundraising)
2. **B2C | Oxy Hacker** — Free Content → Marketing Engineering → Education (Finance Growth, Eng. Negócios, Turnaround) → Micro Franquia → Franquia & Master

Toggle entre B2B e B2C dentro da tela da Value Ladder.

## Modelo de dados

Adicionar conceito de **grupo/degrau** e **trilha (B2B/B2C)**. Duas opções:

**Opção A (recomendada — mínimo de mudança):** Adicionar duas colunas em `products`:
- `ladder_track` (text: 'b2b' | 'b2c' | 'both')
- `ladder_group` (text: ex: "SAAS", "Education", etc.)
- `ladder_order` (int: ordem dentro do grupo)

Os tiers do Kanban continuam funcionando como antes — independentes.

**Opção B:** Tabela separada `ladder_items` mapeando produto → trilha → grupo. Mais flexível mas mais complexo.

→ Sigo com **Opção A** salvo orientação contrária.

## Implementação técnica

```
src/routes/
  index.tsx            (kanban — mantido)
  ladder.tsx           (nova rota /ladder)
src/components/ladder/
  ValueLadder.tsx      (canvas + eixos + grid + título)
  LadderStep.tsx       (post-it amarelo + cards verdes do grupo)
  LadderCard.tsx       (card verde de produto com ticket)
  TrackToggle.tsx      (B2B / B2C)
src/hooks/
  useLadder.ts         (query produtos por trilha, agrupa por ladder_group)
```

- Migration: ALTER TABLE products ADD COLUMN ladder_track / ladder_group / ladder_order + seed dos 17 produtos nos grupos corretos conforme imagens
- Link no header do Kanban: "Ver Value Ladder" → `/ladder`, e vice-versa
- Layout: cada grupo posicionado em `position: absolute` num plano cartesiano, com `bottom` proporcional ao índice de preço e `left` proporcional ao índice de valor (criando o efeito escada)
- Cards verdes mostram nome do produto + ticket em cima do post-it
- Estilo: post-it amarelo `#FEF3A0`, cards `#A8E66C` (verde O2), tipografia sans-serif, sombras sutis para efeito "papel"

## Fora de escopo desta v1

- Drag-and-drop livre tipo Miro (zoom/pan infinito) — apenas visualização estática com scroll
- Edição inline dos grupos (edição continua pelo drawer do Kanban)
- Anotações à mão livre (rabiscos da imagem B2B)

Posso seguir com essa abordagem?
