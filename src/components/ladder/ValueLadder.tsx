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
import { useLadder, TRACK_TITLE, type LadderTrack } from "@/hooks/useLadder";
import {
  useProducts,
  useTiers,
  useAddProductPlacement,
  useMoveProductPlacement,
  useRemoveProductPlacement,
} from "@/hooks/useScale";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { LadderStep, getStepLefts, getStepWidth, STEP_DELTA_Y } from "./LadderStep";
import { ProductsSidebar } from "./ProductsSidebar";
import { AppShell, FooterDot } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";

type DrawerMode = "create" | "edit" | null;

export function ValueLadder() {
  const [track, setTrack] = useState<LadderTrack>("b2b");
  const { data: groups = [], isLoading } = useLadder(track);
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();
  const addPlacement = useAddProductPlacement();
  const movePlacement = useMoveProductPlacement();
  const removePlacement = useRemoveProductPlacement();

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [addGroup, setAddGroup] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeProduct = useMemo(
    () => (activeId ? products.find((p) => p.id === activeId) : undefined),
    [activeId, products],
  );

  const openEdit = (id: string) => {
    setAddGroup(undefined);
    setActiveId(id);
    setDrawerMode("edit");
  };

  const openCreate = (group?: string) => {
    setActiveId(undefined);
    setAddGroup(group);
    setDrawerMode("create");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setActiveId(undefined);
    setAddGroup(undefined);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overData = over.data.current as
      | { type: string; group: string; track: LadderTrack }
      | undefined;
    if (!overData || overData.type !== "ladder-group") return;

    const rawId = String(active.id);

    // Drag de placement existente → MOVE pra outro grupo (mantém só 1 instância nesse drag)
    if (rawId.startsWith("placement:")) {
      const placementId = rawId.slice("placement:".length);
      const activeData = active.data.current as
        | { productId?: string }
        | undefined;
      const product = products.find((p) => p.id === activeData?.productId);
      // Se já existe placement no destino, evita ação redundante
      const already = product?.ladder_placements?.some(
        (lp) =>
          lp.ladder_track === overData.track &&
          lp.ladder_group === overData.group,
      );
      if (already) return;
      movePlacement.mutate({
        placementId,
        track: overData.track,
        group: overData.group,
      });
      return;
    }

    // Drag da sidebar → ADD placement (não remove de outros grupos)
    const productId = rawId.startsWith("sidebar:")
      ? rawId.slice("sidebar:".length)
      : rawId;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const exists = product.ladder_placements?.some(
      (lp) =>
        lp.ladder_track === overData.track &&
        lp.ladder_group === overData.group,
    );
    if (exists) return; // upsert seria no-op, mas evita network
    addPlacement.mutate({
      productId,
      track: overData.track,
      group: overData.group,
    });
  };

  const totalProducts = useMemo(
    () => groups.reduce((acc, g) => acc + g.products.length, 0),
    [groups],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <AppShell
        eyebrow="Portfólio"
        title="Value Ladder"
        flushMain
        sidebar={<ProductsSidebar onOpenProduct={openEdit} activeTrack={track} />}
        actions={
          <>
            <Button
              size="sm"
              className="gap-1.5 rounded-full bg-emerald-deep px-4 text-background hover:bg-emerald-deep/90"
              onClick={() => openCreate(undefined)}
            >
              <Plus className="h-4 w-4" /> Adicionar produto
            </Button>
            <div className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1">
              {(["b2b", "b2c"] as LadderTrack[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrack(t)}
                  className={cn(
                    "rounded-full px-4 py-1 text-xs font-bold tracking-wide transition-colors",
                    track === t
                      ? "bg-emerald-deep text-background shadow-card"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        }
        footerLeft={
          <>
            <FooterDot color="emerald">{totalProducts} produtos ativos</FooterDot>
            <FooterDot color="gold">Trilha {track.toUpperCase()}</FooterDot>
          </>
        }
        footerRight={<span>Arraste pra reordenar · clique pra abrir</span>}
      >
        {(() => {
          const lefts = groups.length ? getStepLefts(groups) : [];
          const last = groups[groups.length - 1];
          const totalWidth = last
            ? lefts[lefts.length - 1] + getStepWidth(last.products.length) + 80
            : 1700;
          const totalHeight = Math.max(800, groups.length * STEP_DELTA_Y + 260);
          return (
            <div
              className="relative mx-auto"
              style={{
                width: Math.max(totalWidth + 200, 1700),
                height: totalHeight,
                backgroundImage:
                  "linear-gradient(to right, oklch(0.32 0.07 165 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.07 165 / 0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            >
              <h2 className="absolute left-1/2 top-6 -translate-x-1/2 font-display text-2xl font-bold text-emerald-deep">
                {TRACK_TITLE[track]}
              </h2>

              {/* Y axis */}
              <div className="absolute bottom-12 left-16 top-20">
                <div className="relative h-full w-px bg-emerald-deep/60">
                  <div
                    className="absolute -left-[5px] -top-1 h-0 w-0"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: "10px solid currentColor",
                      color: "var(--emerald-deep)",
                    }}
                  />
                  <span className="absolute -top-7 -left-3 text-xs font-bold tracking-[0.18em] text-emerald-deep">
                    PREÇO
                  </span>
                </div>
              </div>

              {/* X axis */}
              <div className="absolute bottom-12 left-16 right-12">
                <div className="relative h-px w-full bg-emerald-deep/60">
                  <div
                    className="absolute -right-1 -top-[5px] h-0 w-0"
                    style={{
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: "10px solid currentColor",
                      color: "var(--emerald-deep)",
                    }}
                  />
                  <span className="absolute -bottom-5 right-0 text-xs font-bold tracking-[0.18em] text-emerald-deep">
                    VALOR
                  </span>
                </div>
              </div>

              <div className="absolute bottom-14 left-24 right-16 top-24">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Nenhum produto classificado nesta trilha.
                  </div>
                ) : (
                  <div className="relative h-full" style={{ minWidth: totalWidth }}>
                    {groups.map((g, i) => (
                      <LadderStep
                        key={g.name}
                        group={g}
                        leftPx={lefts[i]}
                        stepIndex={i}
                        track={track}
                        onOpenProduct={openEdit}
                        onAddProduct={openCreate}
                        onRemovePlacement={(pid) =>
                          removePlacement.mutate(pid)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </AppShell>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        defaultLadderTrack={track}
        defaultLadderGroup={addGroup}
        tiers={tiers}
        onClose={closeDrawer}
      />
    </DndContext>
  );
}
