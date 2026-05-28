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
      // Query principal — só products + tiers (sempre existem).
      const { data, error } = await supabase
        .from("products")
        .select("*, product_tiers ( tier_id )")
        .order("position_index", { ascending: true });
      if (error) throw error;

      // Placements em query separada pra tolerar tabela inexistente (PGRST205)
      let placementsByProduct = new Map<string, any[]>();
      const { data: placements, error: placementsError } = await supabase
        .from("product_ladder_placements")
        .select("id, product_id, ladder_track, ladder_group, ladder_order");
      if (!placementsError && placements) {
        for (const lp of placements as any[]) {
          if (!placementsByProduct.has(lp.product_id))
            placementsByProduct.set(lp.product_id, []);
          placementsByProduct.get(lp.product_id)!.push(lp);
        }
      }
      // se placementsError (tabela não existe), seguimos sem placements

      return (data ?? []).map((p: any) => ({
        ...p,
        scope_items: p.scope_items ?? [],
        ladder_track: p.ladder_track ?? null,
        ladder_group: p.ladder_group ?? null,
        ladder_order: p.ladder_order ?? null,
        created_by: p.created_by ?? null,
        category_id: p.category_id ?? null,
        subcategory_id: p.subcategory_id ?? null,
        billing_type: p.billing_type ?? null,
        tier_ids: (p.product_tiers ?? [])
          .map((pt: any) => pt.tier_id)
          .filter(Boolean),
        ladder_placements: (placementsByProduct.get(p.id) ?? []).map((lp: any) => ({
          id: lp.id,
          product_id: lp.product_id,
          ladder_track: lp.ladder_track,
          ladder_group: lp.ladder_group,
          ladder_order: lp.ladder_order ?? 0,
        })),
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

function isMissingColumn(err: any, col: string) {
  if (!err) return false;
  const msg = (err.message ?? "") + " " + (err.hint ?? "");
  return (
    err.code === "PGRST204" ||
    err.code === "42703" ||
    new RegExp(`column .*${col}|'${col}'`, "i").test(msg)
  );
}

export function useCreateProduct() {
      const base: any = {
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
        created_by: form.created_by || null,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id,
        billing_type: form.billing_type,
      };
      let { data, error } = await supabase
        .from("products")
        .insert(base)
        .select()
        .single();
      // Retry sem created_by se a coluna ainda não existe no schema
      if (error && isMissingColumn(error, "created_by")) {
        const { created_by, ...withoutCreatedBy } = base;
        const retry = await supabase
          .from("products")
          .insert(withoutCreatedBy)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
      if (error) throw error;
      await syncTiers(data!.id, form.tier_ids);
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
      const base: any = {
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
        created_by: form.created_by || null,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id,
        billing_type: form.billing_type,
      };
      let { error } = await supabase.from("products").update(base).eq("id", id);
      if (error && isMissingColumn(error, "created_by")) {
        const { created_by, ...withoutCreatedBy } = base;
        const retry = await supabase
          .from("products")
          .update(withoutCreatedBy)
          .eq("id", id);
        error = retry.error;
      }
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

/**
 * Cria um placement do produto num degrau da escada.
 * Idempotente: se já existir placement (product_id, track, group), não duplica.
 * Mesmo produto pode ter múltiplos placements (em grupos/trilhas diferentes).
 */
export function useAddProductPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      track,
      group,
      order,
    }: {
      productId: string;
      track: "b2b" | "b2c";
      group: string;
      order?: number;
    }) => {
      const { error } = await supabase
        .from("product_ladder_placements")
        .upsert(
          {
            product_id: productId,
            ladder_track: track,
            ladder_group: group,
            ladder_order: order ?? 0,
          },
          { onConflict: "product_id,ladder_track,ladder_group" },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ladder", vars.track] });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Erro ao adicionar na ladder"),
  });
}

/**
 * Remove um placement específico (não deleta o produto).
 */
export function useRemoveProductPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (placementId: string) => {
      const { error } = await supabase
        .from("product_ladder_placements")
        .delete()
        .eq("id", placementId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ladder"] });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      toast.success("Produto removido do degrau");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });
}

/**
 * Move placement existente pra outro grupo/trilha.
 * Se o destino já existir (uniqueness), faz delete do origem.
 */
export function useMoveProductPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      placementId,
      track,
      group,
    }: {
      placementId: string;
      track: "b2b" | "b2c";
      group: string;
    }) => {
      const { error } = await supabase
        .from("product_ladder_placements")
        .update({ ladder_track: track, ladder_group: group })
        .eq("id", placementId);
      if (error) {
        // Conflict (já existe placement no destino) — apenas remove o de origem
        const isConflict =
          (error as any).code === "23505" ||
          /duplicate key|unique/i.test(error.message ?? "");
        if (isConflict) {
          const { error: delErr } = await supabase
            .from("product_ladder_placements")
            .delete()
            .eq("id", placementId);
          if (delErr) throw delErr;
          return;
        }
        throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ladder", vars.track] });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao mover"),
  });
}

/** @deprecated mantido pra compat com chamadas antigas; usa hooks de placement novos. */
export function useMoveProductToLadderGroup() {
  const add = useAddProductPlacement();
  return {
    mutate: (v: { productId: string; track: "b2b" | "b2c"; group: string }) =>
      add.mutate(v),
    mutateAsync: (v: { productId: string; track: "b2b" | "b2c"; group: string }) =>
      add.mutateAsync(v),
    isPending: add.isPending,
  };
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

export function useToggleProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ status: active ? "active" : "planned" })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = qc.getQueryData<Product[]>(PRODUCTS_KEY);
      qc.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, status: active ? "active" : "planned" } : p,
        ),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(PRODUCTS_KEY, ctx.prev);
      toast.error(e?.message ?? "Erro ao alterar status");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
    },
  });
}

/**
 * Renomeia um produto. Como products.name é a fonte da verdade, todas as views
 * (Value Ladder, DIAP, Sidebar) que fazem join com products refletem o novo
 * nome automaticamente após invalidação das queries.
 */
export function useRenameProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Nome não pode ficar vazio");
      const { error } = await supabase
        .from("products")
        .update({ name: trimmed })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, name }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = qc.getQueryData<Product[]>(PRODUCTS_KEY);
      qc.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(PRODUCTS_KEY, ctx.prev);
      toast.error(e?.message ?? "Erro ao renomear");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      qc.invalidateQueries({ queryKey: ["diap"] });
    },
    onSuccess: () => toast.success("Produto renomeado"),
  });
}

/**
 * Renomeia uma categoria/grupo da Value Ladder dentro de uma trilha.
 * Atualiza todos os placements (e legacy products.ladder_group) que apontam
 * para o nome antigo dentro da mesma trilha.
 */
export function useRenameLadderGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      track,
      oldName,
      newName,
    }: {
      track: "b2b" | "b2c";
      oldName: string;
      newName: string;
    }) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome não pode ficar vazio");
      if (trimmed === oldName) return;
      // Atualiza placements novos
      const { error } = await supabase
        .from("product_ladder_placements")
        .update({ ladder_group: trimmed })
        .eq("ladder_track", track)
        .eq("ladder_group", oldName);
      if (error && (error as any).code !== "PGRST205") throw error;
      // Best-effort: atualiza coluna legacy em products (tolera ausência)
      await supabase
        .from("products")
        .update({ ladder_group: trimmed })
        .eq("ladder_track", track)
        .eq("ladder_group", oldName);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ladder", vars.track] });
      qc.invalidateQueries({ queryKey: ["ladder"] });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      toast.success("Categoria renomeada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao renomear categoria"),
  });
}

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "development", label: "Em desenvolvimento" },
  { value: "planned", label: "Planejado" },
];

/**
 * Reordena produtos atribuindo novos position_index. Recebe lista
 * { id, position_index } e atualiza só esses produtos.
 * Optimistic update na cache pra UI não piscar.
 */
export function useReorderProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; position_index: number }[]) => {
      await Promise.all(
        updates.map((u) =>
          supabase
            .from("products")
            .update({ position_index: u.position_index })
            .eq("id", u.id)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
    },
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = qc.getQueryData<Product[]>(PRODUCTS_KEY);
      const map = new Map(updates.map((u) => [u.id, u.position_index]));
      qc.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((p) =>
          map.has(p.id) ? { ...p, position_index: map.get(p.id)! } : p,
        ),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(PRODUCTS_KEY, ctx.prev);
      toast.error(e?.message ?? "Erro ao reordenar");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/**
 * Atualiza status e (opcionalmente) position_index de um produto.
 * Usado quando o usuário arrasta um card entre colunas/buckets.
 */
export function useSetProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      position_index,
    }: {
      id: string;
      status: ProductStatus;
      position_index?: number;
    }) => {
      const patch: any = { status };
      if (typeof position_index === "number") patch.position_index = position_index;
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status, position_index }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      const prev = qc.getQueryData<Product[]>(PRODUCTS_KEY);
      qc.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                position_index:
                  typeof position_index === "number"
                    ? position_index
                    : p.position_index,
              }
            : p,
        ),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(PRODUCTS_KEY, ctx.prev);
      toast.error(e?.message ?? "Erro ao mover");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["ladder"] });
    },
  });
}
