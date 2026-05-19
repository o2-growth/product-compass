import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGrid, Network, Palette, Plus, ArrowUpRight } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { useProducts, useTiers } from "@/hooks/useScale";
import {
  DIAP_COLUMNS,
  useAddDiapPlacement,
  useDiap,
  useMoveDiapPlacement,
  useRemoveDiapPlacement,
  type DiapColumn,
} from "@/hooks/useDiap";
import { DiapColumnView } from "./DiapColumn";
import { ProductsSidebar } from "@/components/ladder/ProductsSidebar";
import { ProductDrawer } from "@/components/scale/ProductDrawer";

type DrawerMode = "create" | "edit" | null;

export function Diap() {
  const { data: columns = [], isLoading } = useDiap();
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();
  const add = useAddDiapPlacement();
  const move = useMoveDiapPlacement();
  const remove = useRemoveDiapPlacement();

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeId, setActiveId] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeProduct = useMemo(
    () => (activeId ? products.find((p) => p.id === activeId) : undefined),
    [activeId, products],
  );

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

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overData = over.data.current as
      | { type: string; column: DiapColumn }
      | undefined;
    if (!overData || overData.type !== "diap-column") return;

    const rawId = String(active.id);

    // Move placement existente entre colunas
    if (rawId.startsWith("diap-placement:")) {
      const placementId = rawId.slice("diap-placement:".length);
      move.mutate({ placementId, column: overData.column });
      return;
    }

    // Drag da sidebar de produtos → add placement
    const productId = rawId.startsWith("sidebar:")
      ? rawId.slice("sidebar:".length)
      : rawId;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    add.mutate({ productId, column: overData.column });
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" /> Home
            </Button>
          </Link>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-status-active font-bold text-tier-header">
            O₂
          </div>
          <div>
            <div className="text-sm font-semibold">DIAP</div>
            <div className="text-[11px] text-muted-foreground">
              Arraste produtos da sidebar pra cada letra · clique pra abrir
            </div>
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
              <ArrowUpRight className="h-4 w-4" /> Value Ladder
            </Button>
          </Link>
          <Link to="/whiteboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Palette className="h-4 w-4" /> Whiteboard
            </Button>
          </Link>
          <Link to="/orgchart">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Network className="h-4 w-4" /> Organograma
            </Button>
          </Link>
        </div>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <ProductsSidebar onOpenProduct={openEdit} />

          <main className="relative flex-1 overflow-auto bg-canvas-soft">
            <div className="mx-auto min-h-full p-8" style={{ minWidth: 1200 }}>
              <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
                Metodologia DIAP — Processo de entrada do cliente
              </h1>

              {isLoading ? (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <div className="flex justify-center gap-6">
                  {DIAP_COLUMNS.map((col) => {
                    const data = columns.find((c) => c.column === col);
                    return (
                      <DiapColumnView
                        key={col}
                        column={col}
                        products={data?.products ?? []}
                        onOpenProduct={openEdit}
                        onRemovePlacement={(pid) => remove.mutate(pid)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </DndContext>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        tiers={tiers}
        onClose={closeDrawer}
      />
    </div>
  );
}
