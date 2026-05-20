import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { useProducts, useTiers, useReorderProducts } from "@/hooks/useScale";
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
import { AppShell, FooterDot } from "@/components/shell/AppShell";

type DrawerMode = "create" | "edit" | null;

export function Diap() {
  const { data: columns = [], isLoading } = useDiap();
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();
  const add = useAddDiapPlacement();
  const move = useMoveDiapPlacement();
  const remove = useRemoveDiapPlacement();
  const reorderProducts = useReorderProducts();

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeId, setActiveId] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeProduct = useMemo(
    () => (activeId ? products.find((p) => p.id === activeId) : undefined),
    [activeId, products],
  );

  const totalPlacements = useMemo(
    () => columns.reduce((acc, c) => acc + c.products.length, 0),
    [columns],
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

    // Sidebar sort
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr.startsWith("sidebar:") && overIdStr.startsWith("sidebar:")) {
      const containerId = (active.data.current as any)?.sortable?.containerId as string | undefined;
      const trackFilter =
        containerId === "sidebar-b2b" ? "b2b" :
        containerId === "sidebar-b2c" ? "b2c" : null;

      const sectionProducts = [...products]
        .filter((p) =>
          trackFilter
            ? p.ladder_placements?.some((lp) => lp.ladder_track === trackFilter) || p.ladder_track === trackFilter
            : !p.ladder_placements?.length && !p.ladder_track
        )
        .sort((a, b) => a.position_index - b.position_index);

      const activeIndex = sectionProducts.findIndex((p) => `sidebar:${p.id}` === activeIdStr);
      const overIndex = sectionProducts.findIndex((p) => `sidebar:${p.id}` === overIdStr);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const reordered = arrayMove(sectionProducts, activeIndex, overIndex);
        reorderProducts.mutate(reordered.map((p, i) => ({ id: p.id, position_index: i })));
      }
      return;
    }

    const overData = over.data.current as
      | { type: string; column: DiapColumn }
      | undefined;
    if (!overData || overData.type !== "diap-column") return;

    const rawId = activeIdStr;

    if (rawId.startsWith("diap-placement:")) {
      const placementId = rawId.slice("diap-placement:".length);
      move.mutate({ placementId, column: overData.column });
      return;
    }

    const productId = rawId.startsWith("sidebar:")
      ? rawId.slice("sidebar:".length)
      : rawId;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    add.mutate({ productId, column: overData.column });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <AppShell
        eyebrow="Metodologia"
        title="DIAP — Dados · Informação · Análise · Plano de Ação"
        flushMain
        sidebar={<ProductsSidebar onOpenProduct={openEdit} />}
        actions={
          <Button
            size="sm"
            className="gap-1.5 rounded-full bg-gold px-4 text-white hover:bg-gold/90"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> Adicionar produto
          </Button>
        }
        footerLeft={
          <>
            <FooterDot color="emerald">{products.length} produtos</FooterDot>
            <FooterDot color="gold">{totalPlacements} placements DIAP</FooterDot>
          </>
        }
        footerRight={
          <>
            <span>Arraste produtos da barra lateral pra cada coluna</span>
          </>
        }
      >
        <div className="h-full p-6 lg:p-8">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="flex h-full min-w-[1500px] gap-5 lg:gap-6">
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
      </AppShell>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        tiers={tiers}
        onClose={closeDrawer}
      />
    </DndContext>
  );
}
