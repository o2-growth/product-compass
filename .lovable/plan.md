## Objetivo

Organizar o portfólio por **Categoria → Subcategoria**, com gestão própria e tipo de cobrança **Pontual/Recorrente**, mantendo Produtos como fonte única de verdade (Ladder e DIAP continuam refletindo).

## Modelagem no banco

Três mudanças no schema:

1. **`categories`** (editável pelo usuário)
   - `name`, `order_index`, `color`

2. **`subcategories`** (vinculadas a uma categoria)
   - `category_id` (FK → categories, ON DELETE CASCADE)
   - `name`, `order_index`
   - UNIQUE (category_id, name)

3. **`products`** ganha 3 colunas:
   - `category_id` (FK → categories, ON DELETE SET NULL)
   - `subcategory_id` (FK → subcategories, ON DELETE SET NULL)
   - `billing_type` TEXT — valores `pontual` | `recorrente` | `null`

Seed inicial com as 5 categorias do print (CAAS, SAAS, Education, Expansão, Eventos) e respectivas subcategorias (Enterprise, Corporate, Serviços Especiais, BPO Financeiro, Coordenador as a Service, Oxy, Oxy+Gênio, Setup, Engenheiro de Negócios, Financeiro Raiz, Dono CFO, Sales Finance Program, Franquia, Oxy Hacker, Macro Franquia, G4).

GRANTs + RLS público (mesmo padrão das outras tabelas do projeto).

## Página Produtos — nova UI

Reorganização da rota `/products`:

- **Abas no topo**: `Todas` · `CAAS` · `SAAS` · `Education` · `Expansão` · `Eventos` (geradas dinamicamente a partir da tabela `categories`, ordenadas por `order_index`).
- Dentro de cada aba, tabela com colunas:
  `Ícone · Nome · Subcategoria · Status · Cobrança (Pontual/Recorrente) · Ticket · Tiers · Ladder · DIAP · Ações`
- **Filtros acima da tabela**: Status, Subcategoria (filtrada pela categoria ativa), Cobrança.
- **Agrupamento opcional** por Subcategoria (toggle), igual ao print.
- Aba `Todas` mostra coluna extra `Categoria`.

## Formulário do Produto (ProductDrawer)

Novos campos no `ProductForm`:

- **Categoria** (select de `categories`)
- **Subcategoria** (select dependente — só lista subcategorias da categoria escolhida; permite criar nova inline com botão "+ Nova subcategoria")
- **Cobrança**: radio `Pontual` / `Recorrente` / `Não definido`

Quando o usuário escolhe categoria, o select de subcategoria recarrega. Mudança de categoria limpa subcategoria.

## Gestão de Categorias

Pequena seção na própria página Produtos (botão "Gerenciar categorias" no header da aba), abrindo um drawer com:

- Lista de categorias com drag para reordenar, renomear inline, excluir.
- Dentro de cada categoria, lista de subcategorias (renomear/excluir/adicionar).
- Excluir categoria com produtos vinculados: confirma e os produtos ficam com `category_id = NULL` (vão para aba "Sem categoria").

## Reflexo nas outras páginas

- **Value Ladder e DIAP**: continuam puxando do mesmo `products`. Cards passam a exibir um badge pequeno com a **subcategoria** (opcional, sutil) e ícone de Pontual/Recorrente.
- Nenhuma duplicação de dado — Produtos permanece a fonte única.

## Detalhes técnicos

- Novos hooks: `useCategories`, `useSubcategories(categoryId)`, mutações CRUD.
- `useScale` (products) atualizado para retornar `category_id`, `subcategory_id`, `billing_type` e fazer JOIN com nomes para exibição.
- Tipos em `src/types/scale.ts` recebem os novos campos + tipo `BillingType = "pontual" | "recorrente"`.
- Aba ativa controlada por search param `?cat=<slug>` (TanStack zod adapter) para deep-link.
- Seed das categorias/subcategorias roda na migration. Tentativa de auto-vincular produtos existentes por nome de subcategoria (best-effort, o resto fica sem categoria para o usuário ajustar).

## Ordem de execução

1. Migration: tabelas + colunas + seed + tentativa de auto-vínculo.
2. Hooks de categorias/subcategorias + atualização de `useScale`.
3. Atualizar `ProductForm` e `ProductDrawer` com os novos campos.
4. Reescrever `ProductsTable` com abas + filtros + agrupamento por subcategoria.
5. Drawer de "Gerenciar categorias".
6. Badges sutis de subcategoria/cobrança em Ladder e DIAP.
