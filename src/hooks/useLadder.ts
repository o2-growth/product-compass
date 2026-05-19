import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LadderTrack = "b2b" | "b2c";

export interface LadderProduct {
  /** UUID do placement na tabela product_ladder_placements (chave única do card na escada) */
  placement_id: string;
  /** UUID do produto subjacente — mesmo product_id pode aparecer em múltiplos degraus */
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
  "SaaS",
  "Assessoria Financeira",
  "Special Situations",
];
const B2C_GROUP_ORDER = [
  "Free Content",
  "Marketing Engineering",
  "Education",
  "Micro Franquia",
  "Franquia e Master",
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
    SaaS: "Escala & Produto Entrada",
    "Assessoria Financeira": "Serviço | Gente | Processo",
  },
  b2c: {},
};

export function useLadder(track: LadderTrack) {
  return useQuery({
    queryKey: ["ladder", track],
    queryFn: async (): Promise<LadderGroup[]> => {
      // 1 placement = 1 card na escada. Mesmo product_id pode ter vários placements.
      const { data, error } = await supabase
        .from("product_ladder_placements")
        .select(
          "id, ladder_group, ladder_order, products!inner ( id, name, icon, avg_ticket, status )",
        )
        .eq("ladder_track", track)
        .eq("products.status", "active")
        .order("ladder_order", { ascending: true });
      if (error) throw error;

      const map = new Map<string, LadderProduct[]>();
      for (const row of (data ?? []) as any[]) {
        const g = row.ladder_group as string;
        const p = row.products;
        if (!p) continue;
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push({
          placement_id: row.id,
          id: p.id,
          name: p.name,
          icon: p.icon,
          avg_ticket: p.avg_ticket,
          status: p.status,
          ladder_group: g,
          ladder_order: row.ladder_order ?? 0,
        });
      }

      const knownOrder = GROUP_ORDER[track];
      // Inclui ordem conhecida + grupos custom criados pelo usuário (no fim)
      const seen = new Set<string>(knownOrder);
      const extras = Array.from(map.keys()).filter((g) => !seen.has(g));
      const groupNames = [...knownOrder.filter((g) => map.has(g)), ...extras];

      return groupNames.map<LadderGroup>((name) => {
        const products = map.get(name)!;
        const maxTicket = products.reduce(
          (acc, p) => Math.max(acc, p.avg_ticket ?? 0),
          0,
        );
        return { name, products, maxTicket };
      });
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
