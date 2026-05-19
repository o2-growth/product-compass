-- Normaliza nomes de grupos da escada:
--   B2B: "SAAS"             -> "SaaS"
--   B2C: "Franquia & Master" -> "Franquia e Master"
-- Aplica nas duas fontes: coluna legada products.ladder_group e tabela product_ladder_placements.

UPDATE public.products
   SET ladder_group = 'SaaS'
 WHERE ladder_group = 'SAAS';

UPDATE public.products
   SET ladder_group = 'Franquia e Master'
 WHERE ladder_group = 'Franquia & Master';

UPDATE public.product_ladder_placements
   SET ladder_group = 'SaaS'
 WHERE ladder_group = 'SAAS';

UPDATE public.product_ladder_placements
   SET ladder_group = 'Franquia e Master'
 WHERE ladder_group = 'Franquia & Master';
