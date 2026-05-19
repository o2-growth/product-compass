import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// As 6 colunas fixas do DIAP (ordem horizontal).
// "2P's" e "LUXA" enquadram as 4 letras D-I-A-P da metodologia O2.
export const DIAP_COLUMNS = ["2P's", "D", "I", "A", "P", "LUXA"] as const;
export type DiapColumn = (typeof DIAP_COLUMNS)[number];

export interface DiapProduct {
  placement_id: string;
  product_id: string;
  name: string;
  icon: string;
  avg_ticket: number | null;
  status: string;
  order_index: number;
}

export interface DiapColumnData {
  column: DiapColumn;
  products: DiapProduct[];
}

const DIAP_KEY = ["diap"];

export function useDiap() {
  return useQuery({
    queryKey: DIAP_KEY,
    queryFn: async (): Promise<DiapColumnData[]> => {
      const { data, error } = await supabase
        .from("product_diap_placements")
        .select(
          "id, diap_column, order_index, products!inner ( id, name, icon, avg_ticket, status )",
        )
        .order("order_index", { ascending: true });

      // Se tabela ainda não existe, devolve colunas vazias em vez de quebrar
      if (error) {
        const tableMissing =
          (error as any).code === "PGRST205" ||
          /Could not find the table|does not exist/i.test(error.message ?? "");
        if (tableMissing) {
          return DIAP_COLUMNS.map((column) => ({ column, products: [] }));
        }
        throw error;
      }

      const map = new Map<string, DiapProduct[]>();
      for (const row of (data ?? []) as any[]) {
        const col = row.diap_column as string;
        const p = row.products;
        if (!p) continue;
        if (!map.has(col)) map.set(col, []);
        map.get(col)!.push({
          placement_id: row.id,
          product_id: p.id,
          name: p.name,
          icon: p.icon,
          avg_ticket: p.avg_ticket,
          status: p.status,
          order_index: row.order_index ?? 0,
        });
      }

      return DIAP_COLUMNS.map((column) => ({
        column,
        products: map.get(column) ?? [],
      }));
    },
  });
}

export function useAddDiapPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      column,
      order,
    }: {
      productId: string;
      column: DiapColumn;
      order?: number;
    }) => {
      const { error } = await supabase
        .from("product_diap_placements")
        .upsert(
          {
            product_id: productId,
            diap_column: column,
            order_index: order ?? 0,
          },
          { onConflict: "product_id,diap_column" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIAP_KEY }),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao adicionar"),
  });
}

export function useRemoveDiapPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (placementId: string) => {
      const { error } = await supabase
        .from("product_diap_placements")
        .delete()
        .eq("id", placementId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DIAP_KEY });
      toast.success("Removido da coluna");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });
}

export function useMoveDiapPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      placementId,
      column,
    }: {
      placementId: string;
      column: DiapColumn;
    }) => {
      const { error } = await supabase
        .from("product_diap_placements")
        .update({ diap_column: column })
        .eq("id", placementId);
      if (error) {
        const isConflict =
          (error as any).code === "23505" ||
          /duplicate key|unique/i.test(error.message ?? "");
        if (isConflict) {
          const { error: delErr } = await supabase
            .from("product_diap_placements")
            .delete()
            .eq("id", placementId);
          if (delErr) throw delErr;
          return;
        }
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIAP_KEY }),
    onError: (e: any) => toast.error(e?.message ?? "Erro ao mover"),
  });
}
