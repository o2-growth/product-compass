export type ProductStatus = "active" | "development" | "planned";

export interface Tier {
  id: string;
  name: string;
  label: string;
  min_revenue: number | null;
  max_revenue: number | null;
  order_index: number;
  color: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  scope_items: string[];
  avg_ticket: number | null;
  status: ProductStatus;
  icon: string;
  internal_notes: string | null;
  position_index: number;
  created_at: string;
  updated_at: string;
  tier_ids: string[];
}

export interface ProductFormData {
  name: string;
  description: string;
  scope_items: string[];
  avg_ticket: number | null;
  status: ProductStatus;
  icon: string;
  internal_notes: string;
  tier_ids: string[];
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Ativo",
  development: "Em desenvolvimento",
  planned: "Planejado",
};
