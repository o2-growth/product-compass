
CREATE TABLE public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  min_revenue NUMERIC,
  max_revenue NUMERIC,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6BF169',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scope_items TEXT[] DEFAULT '{}',
  avg_ticket NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','development','planned')),
  icon TEXT DEFAULT '📦',
  internal_notes TEXT,
  position_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.tiers(id) ON DELETE CASCADE,
  UNIQUE(product_id, tier_id)
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS with permissive policies (internal MVP, no auth)
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all tiers" ON public.tiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all product_tiers" ON public.product_tiers FOR ALL USING (true) WITH CHECK (true);

-- Seed tiers
INSERT INTO public.tiers (name, label, min_revenue, max_revenue, order_index) VALUES
  ('Starter',    'Abaixo de R$200k',   NULL,     200000,  0),
  ('Growth',     'R$200k – R$350k',    200000,   350000,  1),
  ('Scale',      'R$350k – R$500k',    350000,   500000,  2),
  ('Pro',        'R$500k – R$1M',      500000,   1000000, 3),
  ('Enterprise', 'R$1M – R$5M',        1000000,  5000000, 4),
  ('Ultra',      'Acima de R$5M',      5000000,  NULL,    5);

-- Seed products
WITH new_products AS (
  INSERT INTO public.products (name, description, scope_items, avg_ticket, status, icon) VALUES
    ('Oxy Finance SaaS',
     'Plataforma financeira SaaS para gestão financeira automatizada.',
     ARRAY['Dashboard financeiro','Fluxo de caixa','DRE automatizado','Integração bancária','Relatórios em tempo real'],
     1500, 'active', '💻'),
    ('BPO Financeiro',
     'Operação financeira terceirizada com CFOs e analistas dedicados.',
     ARRAY['Contas a pagar e receber','Conciliação bancária','Fechamento mensal','Suporte financeiro contínuo'],
     4500, 'active', '⚙️'),
    ('Assessoria Financeira',
     'Assessoria estratégica financeira com acompanhamento mensal.',
     ARRAY['Análise de resultados','Planejamento financeiro','Indicadores de performance','Reunião mensal de resultados'],
     8000, 'active', '📊'),
    ('CFO-as-a-Service',
     'CFO dedicado para empresas em crescimento acelerado.',
     ARRAY['CFO dedicado','Estratégia financeira','Governança e compliance','Planejamento de crescimento','Board meetings'],
     18000, 'active', '🏆'),
    ('Gênio AI',
     'Assistente de inteligência artificial financeiro proprietário da O2 Inc.',
     ARRAY['IA financeira treinada','Análise preditiva','Respostas em linguagem natural','Integração com Oxy Finance'],
     NULL, 'development', '🤖')
  RETURNING id, name
)
INSERT INTO public.product_tiers (product_id, tier_id)
SELECT np.id, t.id FROM new_products np
JOIN public.tiers t ON
  (np.name = 'Oxy Finance SaaS'      AND t.name IN ('Starter','Growth','Scale')) OR
  (np.name = 'BPO Financeiro'        AND t.name IN ('Growth','Scale','Pro')) OR
  (np.name = 'Assessoria Financeira' AND t.name IN ('Scale','Pro','Enterprise')) OR
  (np.name = 'CFO-as-a-Service'      AND t.name IN ('Pro','Enterprise','Ultra')) OR
  (np.name = 'Gênio AI'              AND t.name IN ('Growth','Scale','Pro','Enterprise'));
