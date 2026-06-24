import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
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
  useReorderProducts,
} from "@/hooks/useScale";
import { arrayMove } from "@dnd-kit/sortable";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { LadderStep, getStepLefts, getStepWidth, STEP_DELTA_Y } from "./LadderStep";
import { User, Users, UsersRound } from "lucide-react";

function formatBRL(value: number): string {
  if (value >= 1_000_000) return `~R$ ${(value / 1_000_000).toFixed(2).replace(".", ",")}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function AudienceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-full bg-black/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 shadow">
      <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> C-level</span>
      <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Liderança</span>
      <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" /> Time</span>
    </div>
  );
}
import { ProductsSidebar } from "./ProductsSidebar";
import { AppShell, FooterDot } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

function ZoomToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
}) {
  const pct = Math.round(scale * 100);
  return (
    <div className="pointer-events-auto sticky top-3 z-40 ml-auto flex w-fit items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={onZoomOut}
        disabled={scale <= ZOOM_MIN + 0.001}
        className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        title="Diminuir zoom"
        aria-label="Diminuir zoom"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-w-[44px] rounded-full px-2 py-1 font-mono text-[11px] text-white/80 transition hover:bg-white/10 hover:text-white"
        title="Voltar para 100%"
      >
        {pct}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={scale >= ZOOM_MAX - 0.001}
        className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        title="Aumentar zoom"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <div className="mx-1 h-4 w-px bg-white/10" />
      <button
        type="button"
        onClick={onFit}
        className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Ajustar à tela"
        aria-label="Ajustar à tela"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        title="Resetar para 100%"
        aria-label="Resetar para 100%"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}


function ValueLadderViewport({
  innerW,
  innerH,
  scale,
  setScale,
  hasAutoFit,
  setHasAutoFit,
  wrapperRef,
  isLoading,
  groupsCount,
  computeFitScale,
  clampScale,
  children,
}: {
  innerW: number;
  innerH: number;
  scale: number;
  setScale: (s: number) => void;
  hasAutoFit: boolean;
  setHasAutoFit: (b: boolean) => void;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  groupsCount: number;
  computeFitScale: (w: number, h: number) => number;
  clampScale: (s: number) => number;
  children: React.ReactNode;
}) {
  // Auto-fit na primeira renderização com dados
  useEffect(() => {
    if (hasAutoFit || isLoading || groupsCount === 0) return;
    // próximo tick pra garantir que o parent (main) já mediu
    const id = requestAnimationFrame(() => {
      const fit = computeFitScale(innerW, innerH);
      setScale(fit);
      setHasAutoFit(true);
    });
    return () => cancelAnimationFrame(id);
  }, [hasAutoFit, isLoading, groupsCount, innerW, innerH, computeFitScale, setScale, setHasAutoFit]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <ZoomToolbar
        scale={scale}
        onZoomIn={() => setScale(clampScale(scale + ZOOM_STEP))}
        onZoomOut={() => setScale(clampScale(scale - ZOOM_STEP))}
        onFit={() => setScale(computeFitScale(innerW, innerH))}
        onReset={() => setScale(1)}
      />
      <div
        // wrapper que toma o espaço escalado pra que o scroll do <main> seja correto
        style={{
          width: innerW * scale,
          height: innerH * scale,
          margin: "0 auto",
        }}
      >
        <div
          className="relative"
          style={{
            width: innerW,
            height: innerH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundImage:
              "linear-gradient(to right, oklch(0.32 0.07 165 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.07 165 / 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type DrawerMode = "create" | "edit" | null;


export function ValueLadder() {
  const [track, setTrack] = useState<LadderTrack>("b2b");
  const { data: groups = [], isLoading } = useLadder(track);
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();
  const addPlacement = useAddProductPlacement();
  const movePlacement = useMoveProductPlacement();
  const removePlacement = useRemoveProductPlacement();
  const reorderProducts = useReorderProducts();

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

    // Sidebar sort: ambos os IDs começam com "sidebar:"
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

  // ====== Zoom / Fit-to-screen ======
  const [scale, setScale] = useState(1);
  const [hasAutoFit, setHasAutoFit] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const clampScale = (s: number) =>
    Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s));

  const computeFitScale = (innerW: number, innerH: number) => {
    const scroller = wrapperRef.current?.parentElement; // <main> com overflow-auto
    if (!scroller) return 1;
    const padX = 48;
    const padY = 48;
    const sx = (scroller.clientWidth - padX) / innerW;
    const sy = (scroller.clientHeight - padY) / innerH;
    return clampScale(Math.min(sx, sy));
  };


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
              className="gap-1.5 rounded-full bg-gold px-4 text-white hover:bg-gold/90"
              onClick={() => openCreate(undefined)}
            >
              <Plus className="h-4 w-4" /> Adicionar produto
            </Button>
            <div className="flex items-center gap-1 rounded-full bg-black/25 p-1">
              {(["b2b", "b2c"] as LadderTrack[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrack(t)}
                  className={cn(
                    "rounded-full px-4 py-1 text-xs font-bold tracking-wide transition-colors",
                    track === t
                      ? "bg-gold text-white shadow"
                      : "text-white/60 hover:text-white",
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
          const innerW = Math.max(totalWidth + 200, 1700);
          const innerH = totalHeight;

          return (
            <ValueLadderViewport
              innerW={innerW}
              innerH={innerH}
              scale={scale}
              setScale={setScale}
              hasAutoFit={hasAutoFit}
              setHasAutoFit={setHasAutoFit}
              wrapperRef={wrapperRef}
              isLoading={isLoading}
              groupsCount={groups.length}
              computeFitScale={computeFitScale}
              clampScale={clampScale}
            >
              <h2 className="absolute left-1/2 top-6 -translate-x-1/2 font-display text-2xl font-bold text-white">
                {TRACK_TITLE[track]}
              </h2>

              {/* Y axis */}
              <div className="absolute bottom-12 left-16 top-20">
                <div className="relative h-full w-px bg-bg-elev/60">
                  <div
                    className="absolute -left-[5px] -top-1 h-0 w-0"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: "10px solid currentColor",
                      color: "var(--emerald-deep)",
                    }}
                  />
                  <span className="absolute -top-7 -left-3 text-xs font-bold tracking-[0.18em] text-white">
                    PREÇO
                  </span>
                </div>
              </div>

              {/* X axis */}
              <div className="absolute bottom-12 left-16 right-12">
                <div className="relative h-px w-full bg-bg-elev/60">
                  <div
                    className="absolute -right-1 -top-[5px] h-0 w-0"
                    style={{
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: "10px solid currentColor",
                      color: "var(--emerald-deep)",
                    }}
                  />
                  <span className="absolute -bottom-5 right-0 text-xs font-bold tracking-[0.18em] text-white">
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
            </ValueLadderViewport>
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
