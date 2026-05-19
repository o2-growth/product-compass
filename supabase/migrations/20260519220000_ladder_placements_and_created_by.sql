-- Permite mesmo produto em múltiplos degraus da escada via tabela de junção.
-- A coluna `created_by` é um texto livre (sem auth integrada ainda).

CREATE TABLE IF NOT EXISTS public.product_ladder_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ladder_track TEXT NOT NULL CHECK (ladder_track IN ('b2b', 'b2c')),
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

-- Backfill: cria placements pros produtos que já tinham track+group preenchidos
INSERT INTO public.product_ladder_placements (product_id, ladder_track, ladder_group, ladder_order)
SELECT id, ladder_track, ladder_group, COALESCE(ladder_order, 0)
FROM public.products
WHERE ladder_track IS NOT NULL AND ladder_group IS NOT NULL
ON CONFLICT (product_id, ladder_track, ladder_group) DO NOTHING;

-- Campo criador
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS created_by TEXT;
