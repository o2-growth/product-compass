import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, useTiers } from "@/hooks/useScale";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import type { Product } from "@/types/scale";
import { OrgNode } from "./OrgNode";

type GroupBy = "track" | "status" | "tier";
type DrawerMode = "create" | "edit" | null;

const TRACK_LABEL: Record<string, string> = {
  b2b: "B2B",
  b2c: "B2C",
  none: "Sem trilha",
};

const TRACK_SUBTITLE: Record<string, string> = {
  b2b: "Business to Business",
  b2c: "Business to Consumer",
  none: "Produtos sem classificação",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  active: "Ativos",
  development: "Em desenvolvimento",
  planned: "Planejados",
};

interface TreeGroup {
  key: string;
  label: string;
  icon?: string;
  products: Product[];
}

interface TreeRoot {
  key: string;
  label: string;
  subtitle?: string;
  groups: TreeGroup[];
}

function buildTreeByTrack(products: Product[]): TreeRoot[] {
  const buckets: Record<string, Product[]> = { b2b: [], b2c: [], none: [] };
  for (const p of products) {
    const k = p.ladder_track ?? "none";
    buckets[k].push(p);
  }
  return (Object.keys(buckets) as Array<keyof typeof buckets>)
    .filter((k) => buckets[k].length > 0)
    .map((k) => {
      const list = buckets[k];
      const groupMap = new Map<string, Product[]>();
      for (const p of list) {
        const g = p.ladder_group?.trim() || "Sem grupo";
        if (!groupMap.has(g)) groupMap.set(g, []);
        groupMap.get(g)!.push(p);
      }
      const groups: TreeGroup[] = Array.from(groupMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
        .map(([name, prods]) => ({
          key: `${k}__${name}`,
          label: name,
          products: prods.sort(
            (a, b) => (a.ladder_order ?? 0) - (b.ladder_order ?? 0),
          ),
        }));
      return {
        key: k,
        label: TRACK_LABEL[k],
        subtitle: TRACK_SUBTITLE[k],
        groups,
      };
    });
}

function buildTreeByStatus(products: Product[]): TreeRoot[] {
  const order = ["active", "development", "planned"] as const;
  const result: TreeRoot[] = [];
  for (const status of order) {
    const list = products.filter((p) => p.status === status);
    if (list.length === 0) continue;
    const groupMap = new Map<string, Product[]>();
    for (const p of list) {
      const g = p.ladder_group?.trim() || "Sem grupo";
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(p);
    }
    const groups: TreeGroup[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([name, prods]) => ({
        key: `${status}__${name}`,
        label: name,
        products: prods,
      }));
    result.push({
      key: status,
      label: STATUS_LABEL_MAP[status],
      subtitle: `${list.length} produto(s)`,
      groups,
    });
  }
  return result;
}

function buildTreeByTier(
  products: Product[],
  tiers: { id: string; name: string; label: string; order_index: number }[],
): TreeRoot[] {
  const sortedTiers = [...tiers].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const roots: TreeRoot[] = sortedTiers.map((t) => {
    const list = products.filter((p) => p.tier_ids.includes(t.id));
    const groupMap = new Map<string, Product[]>();
    for (const p of list) {
      const g = p.ladder_group?.trim() || "Sem grupo";
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(p);
    }
    const groups: TreeGroup[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([name, prods]) => ({
        key: `${t.id}__${name}`,
        label: name,
        products: prods,
      }));
    return {
      key: t.id,
      label: t.label || t.name,
      subtitle: `${list.length} produto(s)`,
      groups,
    };
  });

  const noTier = products.filter((p) => p.tier_ids.length === 0);
  if (noTier.length > 0) {
    const groupMap = new Map<string, Product[]>();
    for (const p of noTier) {
      const g = p.ladder_group?.trim() || "Sem grupo";
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(p);
    }
    roots.push({
      key: "no-tier",
      label: "Sem tier",
      subtitle: `${noTier.length} produto(s)`,
      groups: Array.from(groupMap.entries()).map(([name, prods]) => ({
        key: `no-tier__${name}`,
        label: name,
        products: prods,
      })),
    });
  }

  return roots.filter((r) => r.groups.length > 0);
}

export function OrgChart() {
  const { data: products = [], isLoading } = useProducts();
  const { data: tiers = [] } = useTiers();

  const [groupBy, setGroupBy] = useState<GroupBy>("track");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeId, setActiveId] = useState<string | undefined>();

  const activeProduct = useMemo(
    () => (activeId ? products.find((p) => p.id === activeId) : undefined),
    [activeId, products],
  );

  const tree = useMemo<TreeRoot[]>(() => {
    if (groupBy === "track") return buildTreeByTrack(products);
    if (groupBy === "status") return buildTreeByStatus(products);
    return buildTreeByTier(products, tiers);
  }, [groupBy, products, tiers]);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openEdit = (id: string) => {
    setActiveId(id);
    setDrawerMode("edit");
  };

  const openCreate = () => {
    setActiveId(undefined);
    setDrawerMode("create");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setActiveId(undefined);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Kanban
            </Button>
          </Link>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-status-active font-bold text-tier-header">
            O₂
          </div>
          <div>
            <div className="text-sm font-semibold">
              Organograma do Portfólio
            </div>
            <div className="text-[11px] text-muted-foreground">O2 Inc.</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> Adicionar produto
          </Button>

          <Link to="/ladder">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layers className="h-4 w-4" /> Ladder
            </Button>
          </Link>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(
              [
                ["track", "Trilha"],
                ["status", "Status"],
                ["tier", "Tier"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGroupBy(key)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  groupBy === key
                    ? "bg-status-active text-tier-header shadow"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main
        className="flex-1 overflow-auto"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="mx-auto min-w-fit px-8 py-10">
          {isLoading ? (
            <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : tree.length === 0 ? (
            <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          ) : (
            <div className="org-tree flex justify-center gap-12">
              {tree.map((root) => {
                const rootCollapsed = collapsed.has(`root:${root.key}`);
                const totalProducts = root.groups.reduce(
                  (acc, g) => acc + g.products.length,
                  0,
                );
                return (
                  <ul key={root.key} className="org-tree-root">
                    <li>
                      <div className="org-node-wrap">
                        <OrgNode
                          variant="root"
                          label={root.label}
                          subtitle={root.subtitle}
                          childCount={totalProducts}
                          collapsed={rootCollapsed}
                          onToggle={() => toggle(`root:${root.key}`)}
                        />
                      </div>

                      {!rootCollapsed && root.groups.length > 0 && (
                        <ul>
                          {root.groups.map((group) => {
                            const gKey = `group:${group.key}`;
                            const gCollapsed = collapsed.has(gKey);
                            return (
                              <li key={group.key}>
                                <div className="org-node-wrap">
                                  <OrgNode
                                    variant="group"
                                    label={group.label}
                                    childCount={group.products.length}
                                    collapsed={gCollapsed}
                                    onToggle={() => toggle(gKey)}
                                  />
                                </div>
                                {!gCollapsed &&
                                  group.products.length > 0 && (
                                    <ul>
                                      {group.products.map((p) => (
                                        <li key={p.id}>
                                          <div className="org-node-wrap">
                                            <OrgNode
                                              variant="leaf"
                                              label={p.name}
                                              icon={p.icon}
                                              subtitle={
                                                p.description ?? undefined
                                              }
                                              product={p}
                                              onClick={() => openEdit(p.id)}
                                            />
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  </ul>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        tiers={tiers}
        onClose={closeDrawer}
      />

      {/* CSS-only tree connectors */}
      <style>{`
        .org-tree-root,
        .org-tree-root ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .org-tree-root,
        .org-tree-root ul {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .org-tree-root ul {
          flex-direction: row;
          align-items: flex-start;
          gap: 1.5rem;
          padding-top: 2.25rem;
          position: relative;
        }
        .org-tree-root > li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .org-tree-root ul > li {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 0;
        }
        /* Vertical line from parent down to horizontal bar */
        .org-tree-root li:has(> ul)::after,
        .org-tree-root > li:has(> ul)::after {
          content: "";
          position: absolute;
          left: 50%;
          width: 2px;
          height: 1.125rem;
          background: hsl(var(--border));
          transform: translateX(-50%);
        }
        .org-tree-root > li:has(> ul)::after {
          top: 100%;
          margin-top: 0;
        }
        .org-tree-root ul > li:has(> ul)::after {
          bottom: -1.125rem;
          top: auto;
        }
        /* Vertical line from each child up to horizontal bar */
        .org-tree-root ul > li::before {
          content: "";
          position: absolute;
          top: -1.125rem;
          left: 50%;
          width: 2px;
          height: 1.125rem;
          background: hsl(var(--border));
          transform: translateX(-50%);
        }
        /* Horizontal connector bar above siblings */
        .org-tree-root ul::before {
          content: "";
          position: absolute;
          top: 1.125rem;
          left: 0;
          right: 0;
          height: 2px;
          background: hsl(var(--border));
        }
        /* Single child: hide horizontal */
        .org-tree-root ul:has(> li:only-child)::before {
          display: none;
        }
        /* Trim horizontal bar to not stick out past first/last child */
        .org-tree-root ul > li:first-child::after,
        .org-tree-root ul > li:last-child::after {
          /* not used; kept for clarity */
        }
        .org-tree-root ul > li:first-child {
          position: relative;
        }
        .org-tree-root ul > li:first-child > .org-node-wrap::before,
        .org-tree-root ul > li:last-child > .org-node-wrap::before {
          /* covers the overshoot of the horizontal bar */
        }
        .org-tree-root ul > li:first-child {
          margin-left: 0;
        }
        .org-tree-root ul {
          /* clip horizontal bar to inside first/last node centers */
        }
        .org-tree-root ul > li:first-child::after,
        .org-tree-root ul > li:last-child::after {
          content: "";
          position: absolute;
          top: 0;
          width: 50%;
          height: 1.125rem;
          background: hsl(var(--background));
        }
        .org-tree-root ul > li:first-child::after {
          left: 0;
          top: -1.125rem;
        }
        .org-tree-root ul > li:last-child::after {
          right: 0;
          top: -1.125rem;
          left: auto;
        }
        .org-tree-root ul > li:only-child::after {
          display: none;
        }
        .org-node-wrap {
          display: inline-flex;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
