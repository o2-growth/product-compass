## Objetivo

Adicionar uma nova página **Produtos** ao lado de DIAP no nav, mostrando todos os produtos agrupados em 4 buckets com as propriedades selecionadas.

## Buckets (decisão do usuário)

1. **Ativos** — `status = 'active'`
2. **Em planejamento** — `status = 'development'`
3. **Novos** — `created_at >= now() - 30 dias` (independente do status; um produto novo aparece tanto aqui quanto no bucket do próprio status)
4. **Futuros** — `status = 'planned'`

## Propriedades exibidas em cada card

- Ícone + nome (com dot de status)
- Label do status ("Ativo" / "Em desenvolvimento" / "Planejado")
- Notas internas (`internal_notes`)
- Criado por (`created_by`)
- Data de criação (curtinha, ajuda contexto pra bucket "Novos")

## Mudanças

### 1. Nova rota `src/routes/products.tsx`
- `createFileRoute("/products")` com `head()` próprio (title/description).
- Renderiza componente `<ProductsOverview />`.

### 2. Novo componente `src/components/products/ProductsOverview.tsx`
- Usa `useProducts()` (hook já existente).
- Calcula os 4 buckets em memória via `useMemo`.
- Renderiza dentro de `<AppShell>` com 4 colunas (mesma estética do DIAP — header da coluna + grid de cards), responsivo: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`.
- Cada card reaproveita o visual já consolidado (mesmas tokens `bg-bg-elev`, badges de status `STATUS_DOT`/`STATUS_LABEL` de `@/types/scale`).
- Footer mostra contadores por bucket.

### 3. `src/components/shell/AppShell.tsx`
- Adicionar `{ to: "/products", label: "Produtos" }` ao `NAV_ITEMS` (entre DIAP e o fim).

## Resultado

- Nova aba "Produtos" no nav do topo.
- Página `/products` lado-a-lado conceitual com DIAP, mostrando 4 colunas (Ativos, Em planejamento, Novos, Futuros) com cards exibindo nome, ícone, status, notas internas e criado por.
- Dados reativos: criar/editar/desligar produto na sidebar do DIAP atualiza essa página automaticamente (mesma query key `["products"]`).
