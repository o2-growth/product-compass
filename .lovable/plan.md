## Objetivo

Fazer o DIAP se comportar igual ao Value Ladder:
1. Produtos com status diferente de `active` (planejado/desenvolvimento) NÃO aparecem no board do DIAP.
2. Ao desligar um produto na sidebar, ele some do DIAP. Ao religar, volta a aparecer (placement preservado).
3. Garantir que todo produto ativo que está no Ladder também tenha um placement no DIAP (e vice-versa), para os boards conversarem.

## Diagnóstico

**Ladder** (`src/hooks/useLadder.ts` linha 73) filtra `.eq("products.status", "active")` no join — produto inativo some.

**DIAP** (`src/hooks/useDiap.ts` linha 31-36) NÃO filtra por status — qualquer produto com placement aparece, mesmo `planned`/`development`. Por isso "Growth Oxigênio", "NOX Enterprise", "MBA / Pós em Finanças", "Treinamentos Financeiros", "Consultoria Comercial e de Marketing", "Consultoria de Precificação", "Soluções de Crédito" aparecem indevidamente.

**Gap Ladder ↔ DIAP** (snapshot atual do banco):
- No Ladder mas **fora do DIAP** (ativos): `BPO Financeiro` (está no DIAP ok), `Franquia O2` (sem coluna DIAP), `Oxy Hacker` (sem coluna DIAP).
- No DIAP mas **fora do Ladder**: nenhum produto ativo problemático.
- Produtos com placement DIAP mas sem coluna (`diap_column` vazio): `Franquia O2`, `Oxy Hacker` — placements lixo da migração antiga; serão limpos.

## Mudanças

### 1. `src/hooks/useDiap.ts`
Adicionar filtro de status na query do `useDiap()`:
```ts
.select("id, diap_column, order_index, products!inner ( id, name, icon, avg_ticket, status )")
.eq("products.status", "active")
.order("order_index", { ascending: true });
```
Mesma lógica do Ladder: o `!inner` + filtro descarta placements de produtos não-ativos sem perdê-los do banco — quando o usuário religar, o placement volta a aparecer.

### 2. Limpeza de dados (migration / insert tool)
- Deletar os 2 placements órfãos com `diap_column = ''` (Franquia O2, Oxy Hacker).
- Como ficam "ativos fora do DIAP", deixar a sidebar pedindo posicionamento manual — usuário arrasta para a coluna desejada (decisão já confirmada por ele: "deixe na lista aqui de produtos, para eu definir quais devem entrar").

### 3. Sidebar (sem mudança de comportamento, só verificação)
A sidebar já lista TODOS os produtos (ativos e inativos) com o toggle de status. Vai continuar assim — o filtro só afeta o board do DIAP, igual ao Ladder.

## Resultado esperado

- Toggle off em qualquer produto → some do Ladder E do DIAP imediatamente.
- Toggle on → reaparece nos dois boards no placement antigo.
- Produtos sem placement DIAP (Franquia O2, Oxy Hacker) ficam visíveis na sidebar com indicador, prontos pra arrastar.
- DIAP e Ladder passam a mostrar o mesmo conjunto de produtos ativos.
