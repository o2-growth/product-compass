import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/scale";
import { STATUS_LABEL } from "@/types/scale";

const statusClasses: Record<Product["status"], string> = {
  active: "bg-status-active/20 text-foreground border-status-active/40",
  development:
    "bg-status-development/20 text-foreground border-status-development/40",
  planned: "bg-status-planned/20 text-foreground border-status-planned/40",
};

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
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        "hover:shadow-md cursor-grab active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open if not currently dragging
        if (!isDragging) onOpen(product.id);
        e.stopPropagation();
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl leading-none">{product.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {product.name}
          </div>
          <Badge
            variant="outline"
            className={cn("mt-1.5 text-[10px] font-medium", statusClasses[product.status])}
          >
            {STATUS_LABEL[product.status]}
          </Badge>
        </div>
      </div>
      {product.avg_ticket != null && (
        <div className="mt-2 text-xs text-muted-foreground">
          Ticket médio:{" "}
          <span className="font-medium text-foreground">
            R$ {product.avg_ticket.toLocaleString("pt-BR")}
          </span>
        </div>
      )}
    </div>
  );
}
