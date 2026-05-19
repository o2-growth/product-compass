
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ladder_track text,
  ADD COLUMN IF NOT EXISTS ladder_group text,
  ADD COLUMN IF NOT EXISTS ladder_order integer DEFAULT 0;

-- ladder_track: 'b2b' | 'b2c' | 'both' (we'll model "both" via 2 rows only if needed; for v1 single track per product)

CREATE INDEX IF NOT EXISTS idx_products_ladder ON public.products(ladder_track, ladder_group, ladder_order);

-- Seed: classify each product into a ladder track + group based on the reference images

-- B2B track
UPDATE public.products SET ladder_track='b2b', ladder_group='Marketing Engineering', ladder_order=1 WHERE name='Growth Oxigênio';
UPDATE public.products SET ladder_track='b2b', ladder_group='SAAS', ladder_order=1 WHERE name='Oxy Finance® + Gênio®';
UPDATE public.products SET ladder_track='b2b', ladder_group='SAAS', ladder_order=2 WHERE name='BPO Financeiro';
UPDATE public.products SET ladder_track='b2b', ladder_group='SAAS', ladder_order=3 WHERE name='Coordenador Financeiro';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=1 WHERE name='Diagnóstico Estratégico';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=2 WHERE name='Setup';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=3 WHERE name='CFO as a Service (CaaS)';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=4 WHERE name='Consultoria Comercial e de Marketing';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=5 WHERE name='Consultoria de Precificação';
UPDATE public.products SET ladder_track='b2b', ladder_group='Assessoria Financeira', ladder_order=6 WHERE name='NOX Enterprise';
UPDATE public.products SET ladder_track='b2b', ladder_group='Special Situations', ladder_order=1 WHERE name='Turnaround';
UPDATE public.products SET ladder_track='b2b', ladder_group='Special Situations', ladder_order=2 WHERE name='Valuation';
UPDATE public.products SET ladder_track='b2b', ladder_group='Special Situations', ladder_order=3 WHERE name='Soluções de Crédito / Open Finance';

-- B2C track
UPDATE public.products SET ladder_track='b2c', ladder_group='Marketing Engineering', ladder_order=1 WHERE name='Treinamentos Financeiros';
UPDATE public.products SET ladder_track='b2c', ladder_group='Education', ladder_order=1 WHERE name='MBA / Pós em Finanças O2';
UPDATE public.products SET ladder_track='b2c', ladder_group='Micro Franquia', ladder_order=1 WHERE name='Oxy Hacker';
UPDATE public.products SET ladder_track='b2c', ladder_group='Franquia & Master', ladder_order=1 WHERE name='Franquia O2';
