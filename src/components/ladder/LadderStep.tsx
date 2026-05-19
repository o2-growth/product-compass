import { ChevronRight, Plus, GripVertical } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { LadderGroup, LadderTrack, LadderProduct } from "@/hooks/useLadder";
import { TRACK_SUBTITLE, formatTicket } from "@/hooks/useLadder";

const CARD_W = 108;
const CARD_H = 96;
const CARD_GAP = 6;
const PAD = 10;
const MAX_PER_ROW = 3;

// Vertical step delta — fits title + subtitle + yellow block (depends on rows) + margin
const STEP_DELTA_Y = 300;
// Horizontal gap between yellow blocks (no overlap, evita "um em cima do outro")
const STEP_GAP_X = 32;

export interface LadderStepProps {
  group: LadderGroup;
  leftPx: number;
  stepIndex: number;
  track: LadderTrack;
  onOpenProduct: (id: string) => void;
  onAddProduct: (group: string) => void;
}

function DraggableCard({
  product,
  onOpen,
}: {
  product: LadderProduct;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: product.id, data: { type: "ladder-product" } });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: CARD_W,
        height: 96,
        background: "#A8E66C",
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : "auto",
      }}
      className={cn(
        "group relative flex flex-col rounded-sm p-1.5 text-left shadow-sm outline-none transition-shadow duration-150",
        !isDragging && "hover:shadow-md",
      )}
      title={product.name}
    >
      {/* Drag handle (canto superior esquerdo) */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="absolute left-0.5 top-0.5 z-10 flex h-4 w-4 cursor-grab items-center justify-center rounded text-neutral-700 opacity-0 transition-opacity duration-150 hover:bg-black/10 hover:text-neutral-900 active:cursor-grabbing group-hover:opacity-100"
        title="Arrastar"
        aria-label="Arrastar produto"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      {/* Botão "abrir" cobre todo o card exceto o handle */}
      <button
        type="button"
        onClick={() => onOpen(product.id)}
        className="absolute inset-0 flex cursor-pointer flex-col p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        aria-label={`Abrir ${product.name}`}
      >
        <div className="ml-3.5 text-base leading-none">{product.icon || "📦"}</div>
        <div className="mt-1 line-clamp-3 text-[10px] font-semibold leading-tight text-neutral-900">
          {product.name}
        </div>
        <ChevronRight className="absolute bottom-1 right-1 h-3 w-3 text-neutral-800 opacity-0 transition-opacity duration-150 group-hover:opacity-90" />
      </button>
    </div>
  );
}

export function LadderStep({
  group,
  leftPx,
  stepIndex,
  track,
  onOpenProduct,
  onAddProduct,
}: LadderStepProps) {
  const bottom = `${50 + stepIndex * STEP_DELTA_Y}px`;
  const subtitle = TRACK_SUBTITLE[track]?.[group.name];

  // Tiles are only real products, wrapped in rows of MAX_PER_ROW
  const tiles = group.products.length;
  const cols = Math.min(MAX_PER_ROW, Math.max(tiles, 1));
  const innerWidth = cols * CARD_W + (cols - 1) * CARD_GAP + PAD * 2;

  // Build rows of product indices only
  const rows: number[][] = [];
  for (let i = 0; i < tiles; i += MAX_PER_ROW) {
    rows.push(Array.from({ length: Math.min(MAX_PER_ROW, tiles - i) }, (_, k) => i + k));
  }

  const { setNodeRef, isOver } = useDroppable({
    id: `group:${group.name}`,
    data: { type: "ladder-group", group: group.name, track },
  });

  return (
    <div className="absolute" style={{ left: `${leftPx}px`, bottom }}>
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {group.name}
        </h3>
        <button
          type="button"
          onClick={() => onAddProduct(group.name)}
          className="flex h-5 w-5 items-center justify-center rounded-sm border border-dashed border-neutral-400 text-neutral-500 transition-colors hover:border-neutral-700 hover:bg-white hover:text-neutral-900"
          title={`Adicionar produto em ${group.name}`}
          aria-label={`Adicionar produto em ${group.name}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {subtitle && (
        <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
          {subtitle}
        </p>
      )}

      <div
        ref={setNodeRef}
        className={cn(
          "rounded-sm shadow-[0_8px_20px_-10px_rgba(0,0,0,0.3)] transition-all duration-150",
          isOver && "ring-4 ring-neutral-900/40 scale-[1.01]",
        )}
        style={{
          background: "#FEF3A0",
          padding: PAD,
          width: innerWidth,
        }}
      >
        {rows.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className={cn(rIdx > 0 && "mt-2")}>
            {/* Tickets row */}
            <div className="mb-1.5 flex" style={{ gap: CARD_GAP }}>
              {row.map((idx) => {
                const p = group.products[idx];
                return (
                  <div
                    key={`t-${idx}`}
                    className="text-[10px] font-medium leading-tight text-neutral-700"
                    style={{ width: CARD_W }}
                  >
                    {p ? formatTicket(p.avg_ticket) : ""}
                  </div>
                );
              })}
            </div>
            {/* Cards row */}
            <div className="flex" style={{ gap: CARD_GAP }}>
              {row.map((idx) => {
                const p = group.products[idx];
                if (p) {
                  return <DraggableCard key={p.id} product={p} onOpen={onOpenProduct} />;
                }
                return (
                  <button
                    key={`add-${idx}`}
                    type="button"
                    onClick={() => onAddProduct(group.name)}
                    title={`Adicionar produto em ${group.name}`}
                    aria-label={`Adicionar produto em ${group.name}`}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-neutral-500/70 bg-white/40 text-neutral-600 outline-none transition-all duration-150 hover:scale-[1.04] hover:border-neutral-800 hover:bg-white hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900"
                    style={{ width: CARD_W, height: CARD_H }}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="mt-1 text-[10px] font-semibold leading-tight">
                      Novo produto
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getStepWidth(productsCount: number): number {
  const tiles = productsCount + 1;
  const cols = Math.min(MAX_PER_ROW, tiles);
  return cols * CARD_W + (cols - 1) * CARD_GAP + PAD * 2;
}

export function getStepLefts(groups: LadderGroup[]): number[] {
  // Steps são SEQUENCIAIS sem sobreposição: cada step começa STEP_GAP_X após o anterior terminar.
  const lefts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < groups.length; i++) {
    lefts.push(cursor);
    const w = getStepWidth(groups[i].products.length);
    cursor += w + STEP_GAP_X;
  }
  return lefts;
}

export { STEP_DELTA_Y };
