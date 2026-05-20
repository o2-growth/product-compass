import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { AppShell, FooterDot } from "@/components/shell/AppShell";

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
    const overData = over.data.current as
      | { type: string; column: DiapColumn }
      | undefined;
    if (!overData || overData.type !== "diap-column") return;

    const rawId = String(active.id);

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
        title="DIAP — Jornada do cliente"
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
