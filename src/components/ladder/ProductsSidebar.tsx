import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useProducts, useRenameProduct, useToggleProductActive } from "@/hooks/useScale";
import { STATUS_DOT, STATUS_LABEL, type Product } from "@/types/scale";
import { formatTicket } from "@/hooks/useLadder";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EditableText } from "@/components/ui/editable-text";
import { cn } from "@/lib/utils";

function DraggableSidebarItem({
  product,
  onOpen,
}: {
  product: Product;
  onOpen?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `sidebar:${product.id}`, data: { type: "ladder-product", productId: product.id } });
  const toggle = useToggleProductActive();
  const isActive = product.status === "active";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : isActive ? 1 : 0.55,
        zIndex: isDragging ? 1000 : "auto",
      }}
      className={cn(
        "group/item relative flex w-full items-center gap-1 rounded-md px-1 py-1.5 text-left text-xs transition-colors hover:bg-accent",
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing group-hover/item:opacity-100"
        title="Arrastar para a escada"
        aria-label="Arrastar produto"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onOpen?.(product.id)}
        className="flex min-w-0 flex-1 items-start gap-2 text-left outline-none"
      >
        <span className="text-base leading-none">{product.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[product.status]}`}
              title={STATUS_LABEL[product.status]}
            />
            <span
              className={cn(
                "truncate font-medium",
                !isActive && "line-through text-muted-foreground",
              )}
            >
              {product.name}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {formatTicket(product.avg_ticket)}
          </div>
        </div>
      </button>
      <Switch
        checked={isActive}
        onCheckedChange={(checked) =>
          toggle.mutate({ id: product.id, active: checked })
        }
        className="ml-1 scale-75"
        aria-label={isActive ? "Desativar produto" : "Ativar produto"}
        title={isActive ? "Desativar produto" : "Ativar produto"}
      />
    </div>
  );
}




interface Props {
  onOpenProduct?: (id: string) => void;
  activeTrack?: "b2b" | "b2c";
}

export function ProductsSidebar({ onOpenProduct }: Props) {
  const { data: products = [], isLoading } = useProducts();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products, query]);

  const totalTicket = useMemo(
    () => products.reduce((s, p) => s + (p.avg_ticket ?? 0), 0),
    [products],
  );

  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-emerald-deep/10 bg-white py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-deep"
          onClick={() => setCollapsed(false)}
          aria-label="Expandir lista de produtos"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-4 rotate-180 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-deep/50 [writing-mode:vertical-rl]">
          Inventário · {products.length}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-emerald-deep/10 bg-white">
      <div className="flex items-center justify-between border-b border-emerald-deep/10 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-deep/50">
            Inventário
          </div>
          <div className="font-display text-sm font-semibold text-emerald-deep">
            {products.length} produtos
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-deep/50">
            Ticket total {formatTicket(totalTicket)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-deep"
          onClick={() => setCollapsed(true)}
          aria-label="Recolher"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-emerald-deep/10 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-deep/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto..."
            className="h-9 rounded-full border-emerald-deep/10 bg-cream/50 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {isLoading ? (
          <div className="px-2 text-xs text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-2 text-xs text-muted-foreground">
            Nenhum produto encontrado.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((p) => (
              <li key={p.id}>
                <DraggableSidebarItem product={p} onOpen={onOpenProduct} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
