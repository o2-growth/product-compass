import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search, Plus, LayoutGrid, Network, ChevronRight, Palette } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMoveProductToTier,
  useProducts,
  useTiers,
} from "@/hooks/useScale";
import { TierColumn } from "./TierColumn";
import { ProductDrawer } from "./ProductDrawer";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/scale";

export function Canvas() {
  const { data: tiers = [] } = useTiers();
  const { data: products = [], isLoading } = useProducts();
  const move = useMoveProductToTier();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all",
  );
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [defaultTier, setDefaultTier] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const dimmedIds = useMemo(() => {
    const ids = new Set<string>();
    const q = search.trim().toLowerCase();
    if (!q && statusFilter === "all") return ids;
    for (const p of products) {
      const matchQ = !q || p.name.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || p.status === statusFilter;
      if (!(matchQ && matchS)) ids.add(p.id);
    }
    return ids;
  }, [products, search, statusFilter]);

  const productsByTier = useMemo(() => {
    const map = new Map<string, typeof products>();
    tiers.forEach((t) => map.set(t.id, []));
    products.forEach((p) =>
      p.tier_ids.forEach((tid) => {
        if (map.has(tid)) map.get(tid)!.push(p);
      }),
    );
    return map;
  }, [tiers, products]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const productId = String(active.id);
    const newTierId = String(over.id);
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.tier_ids.length === 1 && product.tier_ids[0] === newTierId)
      return;
    move.mutate({ productId, tierId: newTierId });
  };

  const openCreate = (tierId?: string) => {
    setDefaultTier(tierId);
    setActiveId(undefined);
    setDrawerMode("create");
  };

  const openEdit = (id: string) => {
    setActiveId(id);
    setDrawerMode("edit");
  };

  const activeProduct = products.find((p) => p.id === activeId);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/70 bg-background/95 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg border border-status-active/30 bg-background font-bold text-[13px] text-foreground",
              "shadow-[inset_0_0_0_1px_oklch(1_0_0),0_0_12px_-2px_oklch(0.88_0.21_142/0.55)]",
            )}
          >
            <span className="relative z-10">O₂</span>
            <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-status-active/15 to-transparent" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Product Scale Platform</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Portfolio</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="font-medium text-foreground/70">Kanban</span>
            </div>
          </div>
        </div>

        <div className="ml-6 flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="development">Em desenvolvimento</SelectItem>
              <SelectItem value="planned">Planejado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link to="/whiteboard">
          <Button variant="outline" className="gap-1.5">
            <Palette className="h-4 w-4" /> Whiteboard
          </Button>
        </Link>
        <Link to="/orgchart">
          <Button variant="outline" className="gap-1.5">
            <Network className="h-4 w-4" /> Org Chart
          </Button>
        </Link>
        <Link to="/ladder">
          <Button variant="outline" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Value Ladder
          </Button>
        </Link>
        <Button onClick={() => openCreate()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </header>

      {/* Canvas */}
      <main className="flex-1 overflow-hidden bg-canvas-soft">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Carregando portfólio...
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto p-6">
              {tiers.map((t) => (
                <TierColumn
                  key={t.id}
                  tier={t}
                  products={productsByTier.get(t.id) ?? []}
                  dimmedIds={dimmedIds}
                  onOpenProduct={openEdit}
                  onAddProduct={openCreate}
                />
              ))}
            </div>
          </DndContext>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => openCreate()}
        className={cn(
          "fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-tier-header shadow-fab",
          "bg-gradient-to-br from-status-active to-[oklch(0.72_0.19_142)]",
          "ring-1 ring-status-active/40 ring-offset-2 ring-offset-canvas",
          "transition-all duration-200 ease-out hover:scale-[1.08] hover:shadow-card-hover active:scale-95",
        )}
        aria-label="Adicionar produto"
      >
        <Plus className="h-6 w-6 drop-shadow-sm" strokeWidth={2.5} />
      </button>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        defaultTierId={defaultTier}
        tiers={tiers}
        onClose={() => {
          setDrawerMode(null);
          setActiveId(undefined);
          setDefaultTier(undefined);
        }}
      />
    </div>
  );
}
