import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LadderTrack = "b2b" | "b2c";

export interface LadderProduct {
  id: string;
  name: string;
  icon: string;
  avg_ticket: number | null;
  status: string;
  ladder_group: string;
  ladder_order: number;
}

export interface LadderGroup {
  name: string;
  products: LadderProduct[];
  maxTicket: number;
}

// Order of groups along the X axis (value) — derived from the reference images.
const B2B_GROUP_ORDER = [
  "Free Content",
  "Marketing Engineering",
  "SAAS",
  "Assessoria Financeira",
  "Special Situations",
];
const B2C_GROUP_ORDER = [
  "Free Content",
  "Marketing Engineering",
  "Education",
  "Micro Franquia",
  "Franquia & Master",
];

export const GROUP_ORDER: Record<LadderTrack, string[]> = {
  b2b: B2B_GROUP_ORDER,
  b2c: B2C_GROUP_ORDER,
};

export const TRACK_TITLE: Record<LadderTrack, string> = {
  b2b: "Value Ladder B2B | O2 Inc.",
  b2c: "Value Ladder B2C | Oxy Hacker",
};

export const TRACK_SUBTITLE: Record<LadderTrack, Record<string, string>> = {
  b2b: {
    SAAS: "Escala & Produto Entrada",
    "Assessoria Financeira": "Serviço | Gente | Processo",
  },
  b2c: {},
};

export function useLadder(track: LadderTrack) {
  return useQuery({
    queryKey: ["ladder", track],
    queryFn: async (): Promise<LadderGroup[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, icon, avg_ticket, status, ladder_group, ladder_order")
        .eq("ladder_track", track)
        .not("ladder_group", "is", null)
        .order("ladder_order", { ascending: true });
      if (error) throw error;

      const map = new Map<string, LadderProduct[]>();
      for (const row of data ?? []) {
        const g = row.ladder_group as string;
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(row as LadderProduct);
      }

      const ordered = GROUP_ORDER[track]
        .filter((g) => map.has(g))
        .map<LadderGroup>((name) => {
          const products = map.get(name)!;
          const maxTicket = products.reduce(
            (acc, p) => Math.max(acc, p.avg_ticket ?? 0),
            0,
          );
          return { name, products, maxTicket };
        });
      return ordered;
    },
  });
}

export function formatTicket(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1000) {
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  return `12× ${value.toLocaleString("pt-BR")}`;
}
