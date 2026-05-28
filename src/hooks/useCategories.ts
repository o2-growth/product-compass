import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Subcategory } from "@/types/scale";
import { toast } from "sonner";

const CATEGORIES_KEY = ["categories"];
const SUBCATEGORIES_KEY = ["subcategories"];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useSubcategories() {
  return useQuery({
    queryKey: SUBCATEGORIES_KEY,
    queryFn: async (): Promise<Subcategory[]> => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Subcategory[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string | null; order_index?: number }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: input.name.trim(),
          color: input.color ?? null,
          order_index: input.order_index ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success("Categoria criada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar categoria"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; color?: string | null; order_index?: number }) => {
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar"),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: SUBCATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Categoria removida");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });
}

export function useCreateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category_id: string; name: string; order_index?: number }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert({
          category_id: input.category_id,
          name: input.name.trim(),
          order_index: input.order_index ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Subcategory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBCATEGORIES_KEY });
      toast.success("Subcategoria criada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar subcategoria"),
  });
}

export function useUpdateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; order_index?: number }) => {
      const { error } = await supabase.from("subcategories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBCATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar"),
  });
}

export function useDeleteSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBCATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Subcategoria removida");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });
}
