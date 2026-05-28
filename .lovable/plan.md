## Objetivo

O PDF "Oxy Hacker - Produtos" cobre 3 blocos: **CAAS**, **SAAS** e **Diagnóstico Estratégico** (Serviço Especial). Vou usar o conteúdo do PDF para enriquecer descrições e classificar os produtos já cadastrados — sem criar produtos novos além dos que o PDF realmente descreve.

## O que o PDF traz

| Bloco | Subcategorias / variações no PDF | Já existe no app? |
|---|---|---|
| **CAAS** | Enterprise, Corporate | ✅ subcategorias já criadas; produto "CFO as a Service (CaaS)" existe |
| **SAAS** | Setup, Oxy (plataforma), Oxy+Gênio, Oxy+Gênio+Especialista | ✅ subcategorias já criadas; "Setup" e "Oxy Finance® + Gênio®" existem; **falta** "SAAS + Especialista" |
| **Serviços Especiais** | Diagnóstico Estratégico | ✅ produto existe, mas sem categoria |

## Mudanças propostas (data-only — sem migration de schema)

Tudo via `INSERT/UPDATE` na tabela `products`. Nada de novo no schema.

### 1. Atualizar produtos existentes

Para cada produto abaixo: setar `description` (rico, baseado em "O que é" + "Qual dor resolve" do PDF), `scope_items` (escopo contratual em bullets), `category_id`, `subcategory_id` e `billing_type`.

- **CFO as a Service (CaaS)** → CAAS / Enterprise / `recorrente`
  - Descrição cobre as duas variações (Enterprise = padrão vendido com SaaS; Corporate = ticket maior, personalizável)
  - Escopo: 17 itens (Disponibilidade diária, Reunião fixa semanal, Comitê estratégico mensal, DRE, Fluxo de Caixa, Ciclo Financeiro, captação, reestruturação de passivos, etc.)

- **Setup** → SAAS / Setup / `pontual`
  - Descrição: implementação do financeiro estratégico (processos, dados, tecnologia) — 90 dias
  - Escopo: estudo prévio, mapeamento de dados, plano de contas, faturamento, contas a pagar/receber, conciliação bancária, CPV/CMV, integração ERP↔Oxy, validação, treinamento

- **Oxy Finance® + Gênio®** → SAAS / Oxy+Gênio / `recorrente`
  - Descrição: plataforma proprietária (5 anos, +3MM investidos, 50+ CFOs) + Gênio (CFO 24/7)
  - Escopo: DRE, Fluxo de Caixa, Ciclo Financeiro (PMP/PME/PMR), Planejamento Orçamentário, Agente IA Gênio

- **Diagnóstico Estratégico** → CAAS / Serviços Especiais / `pontual`
  - Descrição: diagnóstico econômico-financeiro e operacional + plano de ação (90 dias)
  - Escopo: 9 etapas (Contexto, Rentabilidade, Eficiência Operacional, NCG, Ciclo Financeiro, Endividamento, Projeções, Problemas/Oportunidades, Plano de Ação)

### 2. Criar 1 produto novo

- **SAAS + Especialista** → SAAS / Oxy+Gênio+Especialista / `recorrente`
  - Descrição: Oxy + Gênio + encontros semanais (4/mês) com especialista financeiro
  - Escopo: acesso completo Oxy/Gênio, 4 encontros mensais virtuais agendados, análises baseadas em Oxy/Gênio

### 3. Não mexer (PDF não cobre)

Permanecem como estão: Assessoria Financeira, Diagnóstico 360, Dono CFO, Engenheiro de Negócios, Financeiro Raiz, Franquia O2, Master Franquia, O2 Bank, O2 Tax, Oxy Hacker, Turnaround, Valuation.

## Fora de escopo

- Nenhuma mudança em schema, RLS, UI, hooks ou componentes.
- Nenhum produto novo além do "SAAS + Especialista" (o PDF não traz outros).
- Não vou tentar dividir "CaaS" em dois produtos (Enterprise vs Corporate) — o PDF trata como variações do mesmo produto. Se quiser separar depois, é trivial.

## Execução

1 `supabase--insert` com `UPDATE` dos 4 produtos existentes + `INSERT` do "SAAS + Especialista".