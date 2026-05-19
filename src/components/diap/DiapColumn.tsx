import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiapColumn, DiapProduct } from "@/hooks/useDiap";
import { formatTicket } from "@/hooks/useLadder";

interface Props {
  column: DiapColumn;
  products: DiapProduct[];
  onOpenProduct: (productId: string) => void;
  onRemovePlacement: (placementId: string) => void;
}

function DiapCard({
  product,
  onOpen,
  onRemove,
}: {
  product: DiapProduct;
  onOpen: (id: string) => void;
  onRemove: (placementId: string) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={{
        background: "#FFD08A",
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : "auto",
      }}
      className={cn(
        "group relative w-full rounded-sm p-2 text-left shadow-sm outline-none transition-shadow duration-150",
        !isDragging && "hover:shadow-md",
      )}
      title={product.name}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="absolute left-0.5 top-0.5 z-20 flex h-4 w-4 cursor-grab items-center justify-center rounded text-neutral-700 opacity-0 transition-opacity duration-150 hover:bg-black/10 hover:text-neutral-900 active:cursor-grabbing group-hover:opacity-100"
        title="Arrastar"
        aria-label="Arrastar produto"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      {/* Remover desta coluna */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(product.placement_id);
        }}
        className="absolute right-0.5 top-0.5 z-20 flex h-4 w-4 items-center justify-center rounded text-neutral-700 opacity-0 transition-opacity duration-150 hover:bg-red-500/20 hover:text-red-700 group-hover:opacity-100"
        title="Remover desta coluna"
        aria-label="Remover desta coluna"
      >
        <X className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onOpen(product.product_id)}
        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center p-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        aria-label={`Abrir ${product.name}`}
      >
        <div className="mb-1 text-sm font-semibold leading-tight text-neutral-900">
          {product.name}
        </div>
        {product.avg_ticket != null && (
          <div className="text-[10px] font-medium text-neutral-700">
            {formatTicket(product.avg_ticket)}
          </div>
        )}
        <ChevronRight className="absolute bottom-1 right-1 h-3 w-3 text-neutral-800 opacity-0 transition-opacity duration-150 group-hover:opacity-90" />
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

  return (
    <div className="flex w-44 shrink-0 flex-col items-center">
      {/* Header sticky-note amarelo */}
      <div
        className="mb-6 w-full rounded-sm px-4 py-3 text-center shadow-[0_8px_20px_-10px_rgba(0,0,0,0.3)]"
        style={{ background: "#FEF3A0" }}
      >
        <h3 className="text-xl font-bold text-neutral-900">{column}</h3>
      </div>

      {/* Conector visual */}
      <div className="h-6 w-px bg-neutral-300" />

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[400px] w-full flex-col gap-3 rounded-md border-2 border-dashed border-transparent p-2 transition-colors",
          isOver && "border-neutral-400 bg-neutral-100/50",
        )}
      >
        {products.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center text-[11px] text-muted-foreground">
            Solte produtos aqui
          </div>
        ) : (
          products.map((p) => (
            <div key={p.placement_id} style={{ height: 64 }}>
              <DiapCard
                product={p}
                onOpen={onOpenProduct}
                onRemove={onRemovePlacement}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
