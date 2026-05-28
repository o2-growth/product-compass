export type ProductStatus = "active" | "development" | "planned";
export type LadderTrack = "b2b" | "b2c";
export type BillingType = "pontual" | "recorrente";

export interface Category {
  id: string;
  name: string;
  order_index: number;
  color: string | null;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  order_index: number;
}

export interface Tier {
  id: string;
  name: string;
  label: string;
  min_revenue: number | null;
  max_revenue: number | null;
  order_index: number;
  color: string | null;
}

export interface LadderPlacement {
  id: string;
  product_id: string;
  ladder_track: LadderTrack;
  ladder_group: string;
  ladder_order: number;
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
  ladder_track: LadderTrack | null;
  ladder_group: string | null;
  ladder_order: number | null;
  created_by: string | null;
  ladder_placements: LadderPlacement[];
  category_id: string | null;
  subcategory_id: string | null;
  billing_type: BillingType | null;
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
  ladder_track: LadderTrack | null;
  ladder_group: string;
  ladder_order: number | null;
  created_by: string;
  diap_columns: string[];
  category_id: string | null;
  subcategory_id: string | null;
  billing_type: BillingType | null;
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Ativo",
  development: "Em desenvolvimento",
  planned: "Planejado",
};

export const STATUS_DOT: Record<ProductStatus, string> = {
  active: "bg-status-active",
  development: "bg-status-development",
  planned: "bg-status-planned",
};
