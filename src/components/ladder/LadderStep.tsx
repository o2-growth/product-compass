import { ChevronRight, Plus, GripVertical, X, Sparkles, TrendingUp, Crown } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { LadderGroup, LadderTrack, LadderProduct } from "@/hooks/useLadder";
import { TRACK_SUBTITLE, formatTicket } from "@/hooks/useLadder";
import { EditableText } from "@/components/ui/editable-text";
import { useRenameLadderGroup, useRenameProduct } from "@/hooks/useScale";

const CARD_W = 116;
const CARD_H = 84;
const CARD_GAP = 8;
const PAD = 12;
const MAX_PER_ROW = 5;

// Vertical step delta — fits title + subtitle + step block + margin
const STEP_DELTA_Y = 150;
// Horizontal gap between step blocks
const STEP_GAP_X = 24;

// Color palette inspired by the physical "Escada de Valor": red base, wood middle, blue summit.
// Returns Tailwind-independent CSS values for the step + cards.
export interface StepPalette {
  /** Outer step block — wood/painted top face */
  block: string;
  /** Soft shadow underneath the block to suggest depth */
  shadowColor: string;
  /** Product card surface (slightly darker / saturated variant of the block) */
  card: string;
  /** Card border for definition over the block */
  cardBorder: string;
  /** Text color for product names & tickets on the card */
  cardText: string;
  /** Title pill background */
  titlePill: string;
  /** Title pill text */
  titlePillText: string;
  /** Subtitle text color (over dark bg) */
  subtitle: string;
  /** Ticket label color (over the block surface) */
  ticketText: string;
  /** Icon button color */
  iconColor: string;
}

const PALETTES: Record<"red" | "wood" | "blue", StepPalette> = {
  red: {
    block: "linear-gradient(180deg, #c4322e 0%, #a82622 100%)",
    shadowColor: "rgba(168, 38, 34, 0.45)",
    card: "linear-gradient(180deg, #d94440 0%, #b62a26 100%)",
    cardBorder: "rgba(255,255,255,0.18)",
    cardText: "#ffffff",
    titlePill: "#a82622",
    titlePillText: "#ffffff",
    subtitle: "rgba(255,255,255,0.85)",
    ticketText: "rgba(255,255,255,0.92)",
    iconColor: "rgba(255,255,255,0.85)",
  },
  wood: {
    block: "linear-gradient(180deg, #d99553 0%, #b8732e 100%)",
    shadowColor: "rgba(184, 115, 46, 0.45)",
    card: "linear-gradient(180deg, #c47a3a 0%, #a05f22 100%)",
    cardBorder: "rgba(255,255,255,0.2)",
    cardText: "#ffffff",
    titlePill: "#a05f22",
    titlePillText: "#ffffff",
    subtitle: "rgba(255,255,255,0.9)",
    ticketText: "rgba(255,255,255,0.95)",
    iconColor: "rgba(255,255,255,0.9)",
  },
  blue: {
    block: "linear-gradient(180deg, #3a6a9c 0%, #284f7a 100%)",
    shadowColor: "rgba(40, 79, 122, 0.5)",
    card: "linear-gradient(180deg, #4a82bd 0%, #2e598a 100%)",
    cardBorder: "rgba(255,255,255,0.2)",
    cardText: "#ffffff",
    titlePill: "#284f7a",
    titlePillText: "#ffffff",
    subtitle: "rgba(255,255,255,0.9)",
    ticketText: "rgba(255,255,255,0.95)",
    iconColor: "rgba(255,255,255,0.9)",
  },
};

/**
 * Distribui as cores ao longo da escada: base vermelha, meio madeira/laranja, topo azul.
 * Aproximadamente: primeiros ~30% = vermelho, ~40% do meio = madeira, ~30% do topo = azul.
 */
export function paletteForStep(stepIndex: number, total: number): StepPalette {
  if (total <= 1) return PALETTES.wood;
  const ratio = stepIndex / Math.max(total - 1, 1);
  if (ratio < 0.3) return PALETTES.red;
  if (ratio < 0.7) return PALETTES.wood;
  return PALETTES.blue;
}

/** Estágio da jornada do cliente conforme posição na escada. */
function stageForStep(stepIndex: number, total: number): { label: string; Icon: typeof Sparkles } {
  if (total <= 1) return { label: "Entrada", Icon: Sparkles };
  const ratio = stepIndex / Math.max(total - 1, 1);
  if (ratio < 0.34) return { label: "Entrada", Icon: Sparkles };
  if (ratio < 0.7) return { label: "Crescimento", Icon: TrendingUp };
  return { label: "Premium", Icon: Crown };
}

export interface LadderStepProps {
  group: LadderGroup;
  leftPx: number;
  stepIndex: number;
  totalSteps: number;
  track: LadderTrack;
  onOpenProduct: (id: string) => void;
  onAddProduct: (group: string) => void;
  onRemovePlacement: (placementId: string) => void;
}

function DraggableCard({
  product,
  palette,
  onOpen,
  onRemove,
}: {
  product: LadderProduct;
  palette: StepPalette;
  onOpen: (id: string) => void;
  onRemove: (placementId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `placement:${product.placement_id}`,
      data: { type: "ladder-placement", placementId: product.placement_id, productId: product.id },
    });
  const rename = useRenameProduct();

  return (
    <div
      ref={setNodeRef}
      style={{
        width: CARD_W,
        height: CARD_H,
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : "auto",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.25)",
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md p-1.5 text-left outline-none transition-transform duration-150",
        !isDragging && "hover:-translate-y-0.5",
      )}
      title={product.name}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="absolute left-0.5 top-0.5 z-20 flex h-4 w-4 cursor-grab items-center justify-center rounded text-white/70 opacity-0 transition-opacity duration-150 hover:bg-white/15 hover:text-white active:cursor-grabbing group-hover:opacity-100"
        title="Arrastar"
        aria-label="Arrastar produto"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(product.placement_id);
        }}
        className="absolute right-0.5 top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded text-white/70 opacity-0 transition-opacity duration-150 hover:bg-red-500/40 hover:text-white group-hover:opacity-100"
        title="Remover deste degrau"
        aria-label="Remover deste degrau"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Open overlay */}
      <button
        type="button"
        onClick={() => onOpen(product.id)}
        className="absolute inset-0 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label={`Abrir ${product.name}`}
      />

      <div className="pointer-events-none relative flex h-full flex-col justify-between gap-1 pt-3">
        <div className="pointer-events-auto min-w-0 px-0.5">
          <EditableText
            value={product.name}
            onSave={(name) => rename.mutateAsync({ id: product.id, name })}
            ariaLabel="Renomear produto"
            as="div"
            clamp
            className="block w-full break-words text-[11px] font-bold leading-tight"
            inputClassName="text-[11px] font-bold"
          />
        </div>
        <div
          className="truncate px-0.5 text-[11px] font-semibold tabular-nums"
          style={{ color: palette.ticketText }}
        >
          {formatTicket(product.avg_ticket)}
        </div>
      </div>
    </div>
  );
}

export function LadderStep({
  group,
  leftPx,
  stepIndex,
  totalSteps,
  track,
  onOpenProduct,
  onAddProduct,
  onRemovePlacement,
}: LadderStepProps) {
  const bottom = `${50 + stepIndex * STEP_DELTA_Y}px`;
  const subtitle = TRACK_SUBTITLE[track]?.[group.name];
  const renameGroup = useRenameLadderGroup();
  const palette = paletteForStep(stepIndex, totalSteps);
  const stage = stageForStep(stepIndex, totalSteps);

  const tiles = group.products.length;
  const cols = Math.min(MAX_PER_ROW, Math.max(tiles, 1));
  const innerWidth = cols * CARD_W + (cols - 1) * CARD_GAP + PAD * 2;

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
      {/* Title pill with audience icons */}
      <div
        className="mb-1 inline-flex items-center gap-2 rounded-md px-2.5 py-1 shadow-sm"
        style={{ background: palette.titlePill, color: palette.titlePillText }}
      >
        <stage.Icon className="h-3.5 w-3.5" style={{ color: palette.iconColor }} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-90">
          {stage.label}
        </span>
        <span className="opacity-40">·</span>
        <h3 className="text-[12px] font-bold uppercase tracking-wide">
          <EditableText
            value={group.name}
            onSave={(newName) =>
              renameGroup.mutateAsync({ track, oldName: group.name, newName })
            }
            ariaLabel="Renomear categoria"
            inputClassName="text-[12px] font-bold uppercase tracking-wide"
          />
        </h3>
        <button
          type="button"
          onClick={() => onAddProduct(group.name)}
          className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm border border-white/40 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          title={`Adicionar produto em ${group.name}`}
          aria-label={`Adicionar produto em ${group.name}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {subtitle && (
        <p className="mb-1 px-1 text-[11px] font-medium" style={{ color: palette.subtitle }}>
          {subtitle}
        </p>
      )}

      {/* Step block — the wooden/painted slab */}
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-md transition-all duration-150",
          isOver && "ring-4 ring-white/40 scale-[1.01]",
        )}
        style={{
          background: palette.block,
          padding: PAD,
          width: innerWidth,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 24px -10px ${palette.shadowColor}, 0 2px 0 rgba(0,0,0,0.25)`,
        }}
      >
        {rows.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className={cn(rIdx > 0 && "mt-2")}>
            <div className="flex" style={{ gap: CARD_GAP }}>
              {row.map((idx) => {
                const p = group.products[idx];
                return p ? (
                  <DraggableCard
                    key={p.placement_id}
                    product={p}
                    palette={palette}
                    onOpen={onOpenProduct}
                    onRemove={onRemovePlacement}
                  />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getStepWidth(productsCount: number): number {
  const tiles = productsCount;
  const cols = Math.min(MAX_PER_ROW, Math.max(tiles, 1));
  return cols * CARD_W + (cols - 1) * CARD_GAP + PAD * 2;
}

export function getStepLefts(groups: LadderGroup[]): number[] {
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
