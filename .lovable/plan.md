## Logos
Sim, peguei os dois zips:
- `Logo_O2_-_png.zip` → 4 variantes (Black/White, normais e "-1")
- `o2-Icon-png.zip` → 4 variantes do símbolo (anéis verdes concêntricos)

Vou copiar para `src/assets/o2/` e usar como `<img>` no header e como favicon (`public/`).

## Escopo
Trocar **só a camada de design system** (cores, tipografia, sombras, logo). **Não** mudo grid do Bento, tamanhos de cards, colunas DIAP, sidebar — fica tudo idêntico em forma e dimensão.

## 1. Tokens (`src/styles.css`)
Substituir a paleta Emerald Prestige pelos tokens O2 (dark padrão):

```text
--bg            #3A3A3A   (canvas principal — era cream)
--bg-elev       #2E2E2E   (shell/cards elevados — era white)
--bg-elev-2     #252525
--surface       #4A4A4A
--fg            #FAFAFA   (texto principal — era emerald-deep)
--fg-muted      #C4C4C4
--fg-subtle     #9A9A9A
--accent        #63F161   (Lima 400 — substitui o gold)
--accent-ink    #0A0A0A
--border        rgba(255,255,255,0.10)
```

Re-mapeio os alias legados do projeto para que os componentes existentes continuem funcionando sem refatoração massiva:
- `--emerald-deep` → `--bg-elev` (#2E2E2E)
- `--emerald` → `--accent` (Lima)
- `--gold` → `--accent` (Lima — é o único acento agora)
- `--cream` → `--bg` (#3A3A3A)
- `bg-canvas-soft` → fundo `#3A3A3A` com glows lima sutis
- `shadow-card/hover/shell` → sombras pretas (0,0,0,0.25–0.4) ao invés de emerald

Resultado: header, sidebar, cards, DIAP, ladder, organograma, whiteboard — todos viram dark automaticamente porque já usam as classes `bg-emerald-deep`, `text-emerald-deep`, `bg-gold`, `border-gold`, `bg-cream`. Vão herdar as novas cores via token.

Ajustes pontuais onde o contraste fica ruim no dark (ex.: `text-emerald-deep/40` sobre fundo escuro vira invisível): troco por `text-fg-muted` / `text-white/40` nos arquivos:
- `src/components/diap/DiapColumn.tsx`
- `src/components/ladder/LadderStep.tsx`
- `src/components/ladder/ProductsSidebar.tsx`
- `src/components/orgchart/OrgNode.tsx`
- `src/components/shell/AppShell.tsx`

## 2. Tipografia
Adiciono no `<head>` (via `__root.tsx`) o link do Google Fonts: **Anton + Barlow Condensed + JetBrains Mono + Montserrat**.

> Tusker Grotesk é fonte paga em Google Drive privado — não consigo baixar via script. Uso o fallback oficial do próprio doc (**Anton/Barlow Condensed**) como display. Se quiser, depois você cola os `.woff2` em `public/fonts/tusker-grotesk/` e eu ativo o `@font-face`.

Tokens de fonte:
- `--font-display` → `'Anton', 'Barlow Condensed', Impact, sans-serif`
- `--font-sans` → `'Montserrat', system-ui, sans-serif` (era Manrope/Sora)
- `--font-mono` → `'JetBrains Mono', monospace`

Aplico regra global pros H1–H4: `uppercase`, `letter-spacing: 0.005em`, line-height ~0.96–1.05. Eyebrows passam a usar `font-mono` com tracking 0.14em.

## 3. Logo
- Copio `Logo O2 - White.png` → `src/assets/o2/logo-white.png`
- Copio `Icon.png` → `src/assets/o2/icon.png` e `public/favicon.png`
- No `AppShell` header: substituo o texto eyebrow+title pelo `<img>` do logo branco (altura ~28px), mantendo o slot do título da view ao lado.
- Atualizo `<link rel="icon">` no `__root.tsx`.

## 4. Sombras e forma
Mantenho radius atuais (já bate com o doc: 12/20/pill). Sombras passam a ser pretas neutras conforme spec O2.

## Arquivos editados
- `src/styles.css` (tokens, fontes, sombras, bg-canvas-soft)
- `src/routes/__root.tsx` (Google Fonts + favicon)
- `src/components/shell/AppShell.tsx` (logo no header, ajuste de contraste)
- `src/components/diap/DiapColumn.tsx`, `src/components/ladder/LadderStep.tsx`, `src/components/ladder/ProductsSidebar.tsx`, `src/components/orgchart/OrgNode.tsx` (contraste pontual)
- Novos: `src/assets/o2/logo-white.png`, `src/assets/o2/icon.png`, `public/favicon.png`

## O que NÃO muda
Grid bento, tamanho de cards, drag-and-drop, larguras das colunas DIAP, sidebar de produtos, lógica de edição inline, deletar produto, whiteboard. Apenas vestimenta visual.