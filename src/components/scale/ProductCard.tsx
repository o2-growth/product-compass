import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/scale";
import { STATUS_LABEL, STATUS_DOT } from "@/types/scale";

interface Props {
  product: Product;
  dimmed?: boolean;
  onOpen: (id: string) => void;
}

export function ProductCard({ product, dimmed, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: product.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : dimmed ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border border-border/70 bg-card p-3 shadow-card",
        "transition-all duration-150 ease-out",
        "hover:shadow-card-hover hover:-translate-y-px hover:border-foreground/15",
        "cursor-grab active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open if not currently dragging
        if (!isDragging) onOpen(product.id);
        e.stopPropagation();
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-lg leading-none ring-1 ring-border/60">
          <span>{product.icon || "📦"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground leading-tight">
            {product.name}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                STATUS_DOT[product.status],
              )}
              aria-hidden
            />
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              {STATUS_LABEL[product.status]}
            </span>
          </div>
          {product.description && (
            <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground/90">
              {product.description}
            </p>
          )}
        </div>
      </div>
      {product.avg_ticket != null && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
          <span className="text-muted-foreground">Ticket médio</span>
          <span className="font-semibold text-foreground tabular-nums">
            <span className="text-muted-foreground font-normal mr-0.5">R$</span>
            {product.avg_ticket.toLocaleString("pt-BR")}
          </span>
        </div>
      )}
    </div>
  );
}
