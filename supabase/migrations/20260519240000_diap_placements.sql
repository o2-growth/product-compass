-- Visualização DIAP: produtos posicionados em 6 colunas fixas
-- (2P's, D, I, A, P, LUXA). Mesma lógica de placements da ladder:
-- um produto pode estar em múltiplas colunas; X remove daquela coluna sem deletar.

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
