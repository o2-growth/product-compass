
-- 1. categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. subcategories
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO anon, authenticated;
GRANT ALL ON public.subcategories TO service_role;

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all subcategories" ON public.subcategories FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. products novos campos
ALTER TABLE public.products
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  ADD COLUMN billing_type TEXT CHECK (billing_type IN ('pontual','recorrente'));

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_subcategory ON public.products(subcategory_id);

-- 4. Seed: categorias
INSERT INTO public.categories (name, order_index, color) VALUES
  ('CAAS', 1, '#6BF169'),
  ('SAAS', 2, '#5B8CFF'),
  ('Education', 3, '#F5A623'),
  ('Expansão', 4, '#E94560'),
  ('Eventos', 5, '#A78BFA');

-- 5. Seed: subcategorias
WITH c AS (SELECT id, name FROM public.categories)
INSERT INTO public.subcategories (category_id, name, order_index)
SELECT c.id, s.name, s.ord FROM c JOIN (VALUES
  ('CAAS', 'Enterprise', 1),
  ('CAAS', 'Corporate', 2),
  ('CAAS', 'Serviços Especiais', 3),
  ('CAAS', 'BPO Financeiro', 4),
  ('CAAS', 'Coordenador as a Service', 5),
  ('SAAS', 'Oxy', 1),
  ('SAAS', 'Oxy+Gênio', 2),
  ('SAAS', 'Oxy+Gênio+Especialista', 3),
  ('SAAS', 'Setup', 4),
  ('Education', 'Engenheiro de Negócios', 1),
  ('Education', 'Financeiro Raiz', 2),
  ('Education', 'Dono CFO', 3),
  ('Education', 'Sales Finance Program', 4),
  ('Expansão', 'Franquia', 1),
  ('Expansão', 'Oxy Hacker', 2),
  ('Expansão', 'Macro Franquia', 3),
  ('Eventos', 'G4', 1)
) AS s(cat, name, ord) ON s.cat = c.name;

-- 6. Best-effort auto-link de produtos existentes pelo nome do produto vs nome da subcategoria
UPDATE public.products p
SET subcategory_id = s.id,
    category_id = s.category_id
FROM public.subcategories s
WHERE p.subcategory_id IS NULL
  AND LOWER(TRIM(p.name)) = LOWER(TRIM(s.name));
