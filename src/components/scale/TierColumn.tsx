import { useDroppable } from "@dnd-kit/core";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, Tier } from "@/types/scale";
import { ProductCard } from "./ProductCard";

interface Props {
  tier: Tier;
  products: Product[];
  dimmedIds: Set<string>;
  onOpenProduct: (id: string) => void;
  onAddProduct: (tierId: string) => void;
}

export function TierColumn({
  tier,
  products,
  dimmedIds,
  onOpenProduct,
  onAddProduct,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  return (
    <div
      className={cn(
        "group/col flex h-full w-[300px] shrink-0 flex-col rounded-xl border border-border/70 bg-background/70 backdrop-blur-sm transition-all duration-150",
        "hover:border-foreground/15",
        isOver &&
          "ring-2 ring-status-active ring-offset-2 ring-offset-canvas bg-status-active/5 border-status-active/40",
      )}
    >
      <div className="rounded-t-xl bg-tier-header px-4 py-3 text-tier-header-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-status-active shadow-[0_0_0_3px_oklch(0.88_0.21_142/0.18)]"
              aria-hidden
            />
            <h3 className="truncate text-sm font-semibold tracking-tight">
              {tier.name}
            </h3>
          </div>
          <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-[11px] font-semibold tabular-nums text-white/90">
            {products.length}
          </span>
        </div>
        <p className="mt-0.5 pl-4 text-[11px] font-medium text-tier-header-foreground/70">
          {tier.label}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors bg-dot-grid",
          isOver && "bg-status-active/5",
        )}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            dimmed={dimmedIds.has(p.id)}
            onOpen={onOpenProduct}
          />
        ))}

        {products.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-background/40 py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-[12px] font-medium text-foreground/80">
              Nenhum produto neste tier
            </p>
            <p className="text-[11px] text-muted-foreground">
              Arraste um card ou crie um novo
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 h-7 gap-1 text-[11px]"
              onClick={() => onAddProduct(tier.id)}
            >
              <Plus className="h-3 w-3" /> Adicionar produto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
