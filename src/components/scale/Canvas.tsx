import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search, Plus, LayoutGrid } from "lucide-react";
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
      <header className="flex items-center gap-3 border-b bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-active font-bold text-tier-header">
            O₂
          </div>
          <div>
            <div className="text-sm font-semibold">Product Scale Platform</div>
            <div className="text-[11px] text-muted-foreground">O2 Inc.</div>
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

        <Button onClick={() => openCreate()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </header>

      {/* Canvas */}
      <main className="flex-1 overflow-hidden bg-canvas">
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
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-status-active text-tier-header shadow-lg transition-transform hover:scale-105"
        aria-label="Adicionar produto"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
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
