import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGrid, Network, Plus, Palette } from "lucide-react";
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
  useMoveProductToLadderGroup,
} from "@/hooks/useScale";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { LadderStep, getStepLefts, getStepWidth, STEP_DELTA_Y } from "./LadderStep";
import { ProductsSidebar } from "./ProductsSidebar";

type DrawerMode = "create" | "edit" | null;

export function ValueLadder() {
  const [track, setTrack] = useState<LadderTrack>("b2b");
  const { data: groups = [], isLoading } = useLadder(track);
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();
  const moveGroup = useMoveProductToLadderGroup();

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
    const productId = String(active.id);
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.ladder_track === overData.track && product.ladder_group === overData.group)
      return;
    moveGroup.mutate({
      productId,
      track: overData.track,
      group: overData.group,
    });
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
            <div className="text-sm font-semibold">Value Ladder</div>
            <div className="text-[11px] text-muted-foreground">
              Arraste o card pra outro grupo · clique pra abrir
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => openCreate(undefined)}
          >
            <Plus className="h-4 w-4" /> Adicionar produto
          </Button>

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

          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(["b2b", "b2c"] as LadderTrack[]).map((t) => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={[
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  track === t
                    ? "bg-status-active text-tier-header shadow"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        <ProductsSidebar onOpenProduct={openEdit} activeTrack={track} />

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <main className="relative flex-1 overflow-auto">
          {(() => {
            const lefts = groups.length ? getStepLefts(groups) : [];
            const last = groups[groups.length - 1];
            const totalWidth = last
              ? lefts[lefts.length - 1] + getStepWidth(last.products.length) + 80
              : 1700;
            // Altura suficiente pra acomodar todos os steps escalando STEP_DELTA_Y cada um
            const totalHeight = Math.max(800, groups.length * STEP_DELTA_Y + 260);
            return (
              <div
                className="relative mx-auto"
                style={{
                  width: Math.max(totalWidth + 200, 1700),
                  height: totalHeight,
                  backgroundImage:
                    "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              >
                {/* Title */}
                <h1 className="absolute left-1/2 top-6 -translate-x-1/2 text-2xl font-bold text-foreground">
                  {TRACK_TITLE[track]}
                </h1>

                {/* Y axis */}
                <div className="absolute bottom-12 left-16 top-20">
                  <div className="relative h-full w-px bg-foreground">
                    <div
                      className="absolute -left-[5px] -top-1 h-0 w-0"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderBottom: "10px solid currentColor",
                      }}
                    />
                    <span className="absolute -top-7 -left-3 text-xs font-bold tracking-wider text-foreground">
                      PREÇO
                    </span>
                  </div>
                </div>

                {/* X axis */}
                <div className="absolute bottom-12 left-16 right-12">
                  <div className="relative h-px w-full bg-foreground">
                    <div
                      className="absolute -right-1 -top-[5px] h-0 w-0"
                      style={{
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        borderLeft: "10px solid currentColor",
                      }}
                    />
                    <span className="absolute -bottom-5 right-0 text-xs font-bold tracking-wider text-foreground">
                      VALOR
                    </span>
                  </div>
                </div>

                {/* Steps area */}
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
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </main>
      </DndContext>
      </div>

      <ProductDrawer
        mode={drawerMode}
        product={activeProduct}
        defaultLadderTrack={track}
        defaultLadderGroup={addGroup}
        tiers={tiers}
        onClose={closeDrawer}
      />
    </div>
  );
}
