-- 1. Coluna criador
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Normaliza categorias existentes
UPDATE public.products SET ladder_group='SaaS'              WHERE ladder_group='SAAS';
UPDATE public.products SET ladder_group='Franquia e Master' WHERE ladder_group='Franquia & Master';

-- 3. Tabela de placements da Value Ladder
CREATE TABLE IF NOT EXISTS public.product_ladder_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ladder_track TEXT NOT NULL CHECK (ladder_track IN ('b2b','b2c')),
  ladder_group TEXT NOT NULL,
  ladder_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, ladder_track, ladder_group)
);
CREATE INDEX IF NOT EXISTS idx_placements_track_group
  ON public.product_ladder_placements(ladder_track, ladder_group, ladder_order);
ALTER TABLE public.product_ladder_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public all placements" ON public.product_ladder_placements;
CREATE POLICY "public all placements" ON public.product_ladder_placements
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela de placements do DIAP
CREATE TABLE IF NOT EXISTS public.product_diap_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  diap_column TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, diap_column)
);
CREATE INDEX IF NOT EXISTS idx_diap_placements_column
  ON public.product_diap_placements(diap_column, order_index);
ALTER TABLE public.product_diap_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public all diap_placements" ON public.product_diap_placements;
CREATE POLICY "public all diap_placements" ON public.product_diap_placements
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Backfill ladder a partir das colunas legadas
INSERT INTO public.product_ladder_placements (product_id, ladder_track, ladder_group, ladder_order)
SELECT id, ladder_track, ladder_group, COALESCE(ladder_order,0)
FROM public.products
WHERE ladder_track IS NOT NULL AND ladder_group IS NOT NULL
ON CONFLICT (product_id, ladder_track, ladder_group) DO NOTHING;

-- 6. Pré-popula DIAP
INSERT INTO public.product_diap_placements (product_id, diap_column, order_index)
SELECT p.id, m.col, m.ord
FROM public.products p
JOIN (VALUES
  ('Setup',                               '2P''s', 1),
  ('BPO Financeiro',                      '2P''s', 2),
  ('Treinamentos Financeiros',            '2P''s', 3),
  ('MBA / Pós em Finanças O2',            '2P''s', 4),
  ('Diagnóstico Estratégico',             'D',     1),
  ('Oxy Finance® + Gênio®',               'I',     1),
  ('Coordenador Financeiro',              'A',     1),
  ('CFO as a Service (CaaS)',             'A',     2),
  ('Oxy Finance® + Gênio®',               'A',     3),
  ('Consultoria Comercial e de Marketing','P',     1),
  ('Consultoria de Precificação',         'P',     2),
  ('CFO as a Service (CaaS)',             'P',     3),
  ('NOX Enterprise',                      'LUXA',  1),
  ('Soluções de Crédito / Open Finance',  'LUXA',  2),
  ('Turnaround',                          'LUXA',  3),
  ('Valuation',                           'LUXA',  4),
  ('Growth Oxigênio',                     'LUXA',  5)
) AS m(name, col, ord) ON p.name = m.name
ON CONFLICT (product_id, diap_column) DO NOTHING;