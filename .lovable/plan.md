## Objetivo

Permitir arrastar cards dentro de cada coluna da página `/products` pra reordenar visualmente, persistindo a ordem no banco.

## Escopo

- Arrasto **só dentro do mesmo bucket** (Ativos, Em planejamento, Novos, Futuros). Não muda status — pra trocar de bucket, o usuário continua usando o drawer/sidebar.
- Persiste em `products.position_index`, mesmo campo que já ordena `useProducts()`.

## Estratégia de persistência

Ao reordenar um bucket, pegamos os `position_index` atuais dos cards visíveis daquele bucket e **reatribuímos** os mesmos valores na nova ordem. Vantagens:
- Não mexe nas posições de produtos de outros buckets (mantém intercalação global).
- Update curto (só os N produtos da coluna), sem renumeração global.

Exemplo: bucket tem [A=3, B=7, C=10]. Usuário move C pro topo → escrita: C.position_index=3, A=7, B=10.

## Mudanças

### 1. `src/hooks/useScale.ts`
Adicionar `useReorderProducts()`:
- Recebe `Array<{ id: string; position_index: number }>`.
- Faz updates em paralelo (`Promise.all` de `supabase.from("products").update({position_index}).eq("id", id)`).
- Optimistic update na cache `["products"]` pra UI não piscar.
- Invalida `["products"]` no `onSettled`.

### 2. `src/components/products/ProductsOverview.tsx`
- Envolver tudo em `<DndContext>` com `PointerSensor` (mesma config do DIAP).
- Cada `BucketColumn` vira um `<SortableContext items={ids} strategy={verticalListSortingStrategy}>`.
- `ProductCard` usa `useSortable({ id: product.id })` — aplica `transform`/`transition`, `attributes`/`listeners` no card inteiro (cursor `grab`).
- `id` do sortable inclui prefixo do bucket (ex: `active:uuid`) pra evitar colisão entre colunas, e o `onDragEnd` só processa quando origem e destino estão no mesmo bucket.
- Após reorder local (via `arrayMove`), chama `reorder.mutate(...)` com as novas posições.

### 3. Detalhes visuais
- Card ganha `cursor-grab active:cursor-grabbing`.
- Enquanto arrastando (`isDragging`), aplicar `opacity-50` e `z-10` no clone.
- Ícone sutil de "drag handle" (≡) no canto do card como dica visual — opcional, mas ajuda descoberta.

## Resultado

Na página `/products`, o usuário arrasta um card pra cima/baixo dentro da coluna; a ordem se mantém na próxima visita e também afeta a ordem padrão de `useProducts()` (sidebar do DIAP, etc.) já que tudo lê de `position_index`.
