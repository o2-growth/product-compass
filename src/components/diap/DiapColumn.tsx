import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiapColumn, DiapProduct } from "@/hooks/useDiap";
import { formatTicket } from "@/hooks/useLadder";
import { EditableText } from "@/components/ui/editable-text";
import { useRenameProduct } from "@/hooks/useScale";

interface Props {
  column: DiapColumn;
  products: DiapProduct[];
  onOpenProduct: (productId: string) => void;
  onRemovePlacement: (placementId: string) => void;
}

// Estilo visual por coluna. 2P's e LUXA são os extremos (premium / entrada).
const COLUMN_META: Record<
  DiapColumn,
  { label: string; sub: string; accent: "emerald" | "gold" | "muted"; isLuxa?: boolean }
> = {
  "2P's": { label: "2P's", sub: "Planejamento", accent: "emerald" },
  D: { label: "D", sub: "Diagnóstico", accent: "emerald" },
  I: { label: "I", sub: "Implementação", accent: "emerald" },
  A: { label: "A", sub: "Análise", accent: "emerald" },
  P: { label: "P", sub: "Performance", accent: "emerald" },
  LUXA: { label: "LUXA", sub: "Exit / Premium", accent: "gold", isLuxa: true },
};

function DiapCard({
  product,
  onOpen,
  onRemove,
  isLuxa,
}: {
  product: DiapProduct;
  onOpen: (id: string) => void;
  onRemove: (placementId: string) => void;
  isLuxa?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `diap-placement:${product.placement_id}`,
      data: {
        type: "diap-placement",
        placementId: product.placement_id,
        productId: product.product_id,
      },
    });
  const rename = useRenameProduct();

  if (isLuxa) {
    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          opacity: isDragging ? 0.4 : 1,
          zIndex: isDragging ? 1000 : "auto",
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep p-4 shadow-lg shadow-emerald-deep/20 transition-all",
          !isDragging && "hover:-translate-y-0.5 hover:shadow-xl",
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold/15 blur-xl" />
        {/* Controles */}
        <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-gold/70 hover:bg-white/10 hover:text-gold active:cursor-grabbing"
            title="Arrastar"
            aria-label="Arrastar produto"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(product.placement_id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gold/70 hover:bg-red-500/20 hover:text-red-300"
            title="Remover desta coluna"
            aria-label="Remover desta coluna"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpen(product.product_id)}
          className="relative w-full text-left outline-none"
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold">
              Prestige Tier
            </span>
          </div>
          <h4 className="font-display text-sm font-semibold leading-tight text-white">
            {product.name}
          </h4>
          {product.avg_ticket != null && (
            <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/40">
                  Ticket
                </span>
                <span className="text-xs font-bold text-gold">
                  {formatTicket(product.avg_ticket)}
                </span>
              </div>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : "auto",
      }}
      className={cn(
        "group relative rounded-2xl border border-emerald-deep/10 bg-white p-4 shadow-card transition-all",
        !isDragging && "hover:-translate-y-0.5 hover:border-gold hover:shadow-card-hover",
      )}
    >
      <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-emerald-deep/40 hover:bg-emerald-deep/5 hover:text-emerald-deep active:cursor-grabbing"
          title="Arrastar"
          aria-label="Arrastar produto"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(product.placement_id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-deep/40 hover:bg-red-500/10 hover:text-red-600"
          title="Remover desta coluna"
          aria-label="Remover desta coluna"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpen(product.product_id)}
        className="w-full text-left outline-none"
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-deep/5 text-base">
            {product.icon || "📦"}
          </div>
        </div>
        <h4 className="font-display text-sm font-semibold leading-tight text-emerald-deep">
          {product.name}
        </h4>
        {product.avg_ticket != null && (
          <div className="mt-4 flex items-center justify-between border-t border-emerald-deep/5 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-deep/40">
              Ticket
            </span>
            <span className="text-xs font-bold text-emerald-deep">
              {formatTicket(product.avg_ticket)}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

export function DiapColumnView({
  column,
  products,
  onOpenProduct,
  onRemovePlacement,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `diap-column:${column}`,
    data: { type: "diap-column", column },
  });

  const meta = COLUMN_META[column];
  const count = products.length;

  return (
    <div className="flex w-64 shrink-0 flex-col gap-4">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b-2 px-2 pb-3",
          meta.accent === "gold" ? "border-gold" : "border-emerald",
        )}
      >
        <div className="flex flex-col leading-tight">
          <h3
            className={cn(
              "font-display text-sm font-bold tracking-wide",
              meta.accent === "gold" ? "text-gold" : "text-emerald-deep",
            )}
          >
            {meta.label}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-deep/50">
            {meta.sub}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            count === 0
              ? "bg-emerald-deep/5 text-emerald-deep/40"
              : meta.accent === "gold"
                ? "bg-gold text-white"
                : "bg-emerald text-white",
          )}
        >
          {String(count).padStart(2, "0")}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-3 rounded-3xl border-2 border-dashed border-transparent p-2 transition-colors",
          isOver && "border-gold bg-gold/5",
          count === 0 && !isOver && "border-emerald-deep/10",
        )}
      >
        {count === 0 ? (
          <div className="group/empty flex flex-1 cursor-default items-center justify-center rounded-2xl py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-deep/10 text-emerald-deep/30 transition-colors group-hover/empty:border-gold group-hover/empty:text-gold">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-deep/30">
                Solte aqui
              </span>
            </div>
          </div>
        ) : (
          products.map((p) => (
            <DiapCard
              key={p.placement_id}
              product={p}
              onOpen={onOpenProduct}
              onRemove={onRemovePlacement}
              isLuxa={meta.isLuxa}
            />
          ))
        )}
      </div>
    </div>
  );
}
