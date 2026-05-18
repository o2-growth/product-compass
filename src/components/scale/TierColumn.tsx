import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
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
        "flex h-full w-[300px] shrink-0 flex-col rounded-xl border bg-background/60 transition-colors",
        isOver && "ring-2 ring-status-active bg-status-active/5",
      )}
    >
      <div className="rounded-t-xl bg-tier-header px-4 py-3 text-tier-header-foreground">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{tier.name}</h3>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
            {products.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-tier-header-foreground/70">
          {tier.label}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
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
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="text-xs text-muted-foreground">Sem produtos</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 text-xs"
              onClick={() => onAddProduct(tier.id)}
            >
              <Plus className="mr-1 h-3 w-3" /> Adicionar produto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
