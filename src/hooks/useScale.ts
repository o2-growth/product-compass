import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductFormData, ProductStatus, Tier } from "@/types/scale";
import { toast } from "sonner";

const TIERS_KEY = ["tiers"];
const PRODUCTS_KEY = ["products"];

export function useTiers() {
  return useQuery({
    queryKey: TIERS_KEY,
    queryFn: async (): Promise<Tier[]> => {
      const { data, error } = await supabase
        .from("tiers")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tier[];
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_tiers ( tier_id )")
        .order("position_index", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        scope_items: p.scope_items ?? [],
        ladder_track: p.ladder_track ?? null,
        ladder_group: p.ladder_group ?? null,
        ladder_order: p.ladder_order ?? null,
        tier_ids: (p.product_tiers ?? [])
          .map((pt: any) => pt.tier_id)
          .filter(Boolean),
      })) as Product[];
    },
  });
}

async function syncTiers(productId: string, tierIds: string[]) {
  const { error: delErr } = await supabase
    .from("product_tiers")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;
  if (tierIds.length === 0) return;
  const rows = tierIds.map((tier_id) => ({ product_id: productId, tier_id }));
  const { error } = await supabase.from("product_tiers").insert(rows);
  if (error) throw error;
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: ProductFormData) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: form.name,
          description: form.description || null,
          scope_items: form.scope_items,
          avg_ticket: form.avg_ticket,
          status: form.status,
          icon: form.icon || "📦",
          internal_notes: form.internal_notes || null,
          ladder_track: form.ladder_track,
          ladder_group: form.ladder_group || null,
          ladder_order: form.ladder_order ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      await syncTiers(data.id, form.tier_ids);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      toast.success("Produto criado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      form,
    }: {
      id: string;
      form: ProductFormData;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          description: form.description || null,
          scope_items: form.scope_items,
          avg_ticket: form.avg_ticket,
          status: form.status,
          icon: form.icon || "📦",
          internal_notes: form.internal_notes || null,
          ladder_track: form.ladder_track,
          ladder_group: form.ladder_group || null,
          ladder_order: form.ladder_order ?? 0,
        })
        .eq("id", id);
      if (error) throw error;
      await syncTiers(id, form.tier_ids);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      toast.success("Produto atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      toast.success("Produto removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });
}

export function useMoveProductToLadderGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      track,
      group,
    }: {
      productId: string;
      track: "b2b" | "b2c";
      group: string;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({ ladder_track: track, ladder_group: group })
        .eq("id", productId);
      if (error) throw error;
    },
    onMutate: async ({ productId, track, group }) => {
      await qc.cancelQueries({ queryKey: ["ladder", track] });
      const prev = qc.getQueryData(["ladder", track]);
      qc.setQueriesData<any>({ queryKey: ["ladder"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old;
      });
      return { prev };
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao mover na ladder"),
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["ladder", vars.track] });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useMoveProductToTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      tierId,
    }: {
      productId: string;
      tierId: string;
    }) => {
      await syncTiers(productId, [tierId]);
    },
    onMutate: async ({ productId, tierId }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = qc.getQueryData<Product[]>(PRODUCTS_KEY);
      qc.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((p) =>
          p.id === productId ? { ...p, tier_ids: [tierId] } : p,
        ),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(PRODUCTS_KEY, ctx.prev);
      toast.error(e?.message ?? "Erro ao mover");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "development", label: "Em desenvolvimento" },
  { value: "planned", label: "Planejado" },
];
