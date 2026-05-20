import { useMemo } from "react";
import { useProducts, useReorderProducts } from "@/hooks/useScale";
import { AppShell, FooterDot } from "@/components/shell/AppShell";
import {
  STATUS_DOT,
  STATUS_LABEL,
  type Product,
  type ProductStatus,
} from "@/types/scale";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type BucketKey = "active" | "development" | "new" | "planned";

const BUCKETS: { key: BucketKey; label: string; sub: string }[] = [
  { key: "active", label: "Ativos", sub: "Em operação" },
  { key: "development", label: "Em planejamento", sub: "Em desenvolvimento" },
  { key: "new", label: "Novos", sub: "Criados nos últimos 30 dias" },
  { key: "planned", label: "Futuros", sub: "Planejados / backlog" },
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function bucketsFor(p: Product): BucketKey[] {
  const out: BucketKey[] = [];
  if (p.status === "active") out.push("active");
  if (p.status === "development") out.push("development");
  if (p.status === "planned") out.push("planned");
  const createdMs = p.created_at ? new Date(p.created_at).getTime() : 0;
  if (createdMs && Date.now() - createdMs <= THIRTY_DAYS_MS) out.push("new");
  return out;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// id composto pra evitar colisão entre buckets (mesmo produto pode aparecer em "new" + outro)
const sid = (bucket: BucketKey, productId: string) => `${bucket}::${productId}`;
const parseSid = (id: string) => {
  const [bucket, productId] = id.split("::");
  return { bucket: bucket as BucketKey, productId };
};

function SortableProductCard({
  product,
  bucket,
}: {
  product: Product;
  bucket: BucketKey;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sid(bucket, product.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = product.status as ProductStatus;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-bg-elev-2 p-4 shadow-sm transition-colors hover:border-white/20",
        isDragging && "z-10 opacity-50",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 cursor-grab rounded-md p-1 text-white/30 opacity-0 transition hover:bg-white/5 hover:text-white/70 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/30 text-lg">
          {product.icon || "📦"}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                STATUS_DOT[status],
              )}
            />
            <h3 className="truncate font-display text-sm font-medium text-white">
              {product.name}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>

      {product.internal_notes ? (
        <p className="line-clamp-4 text-xs leading-relaxed text-white/70">
          {product.internal_notes}
        </p>
      ) : (
        <p className="text-xs italic text-white/30">Sem notas internas</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3 text-[10px] uppercase tracking-[0.12em] text-white/40">
        <span className="font-mono">
          {product.created_by ? `por ${product.created_by}` : "sem autor"}
        </span>
        <span className="font-mono">{formatDate(product.created_at)}</span>
      </div>
    </div>
  );
}

function BucketColumn({
  bucket,
  label,
  sub,
  products,
}: {
  bucket: BucketKey;
  label: string;
  sub: string;
  products: Product[];
}) {
  const itemIds = products.map((p) => sid(bucket, p.id));
  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-bg-elev p-4">
      <div className="mb-4 flex items-baseline justify-between gap-2 px-1">
        <div>
          <h2 className="font-display text-base font-medium uppercase tracking-wide text-white">
            {label}
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            {sub}
          </p>
        </div>
        <span className="rounded-full bg-black/30 px-2.5 py-1 font-mono text-[11px] text-white/70">
          {products.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {products.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-white/30">
            Nenhum produto
          </div>
        ) : (
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {products.map((p) => (
              <SortableProductCard key={p.id} product={p} bucket={bucket} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export function ProductsOverview() {
  const { data: products = [], isLoading } = useProducts();
  const reorder = useReorderProducts();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<BucketKey, Product[]> = {
      active: [],
      development: [],
      new: [],
      planned: [],
    };
    for (const p of products) {
      for (const k of bucketsFor(p)) map[k].push(p);
    }
    // ordena cada bucket por position_index asc (mesmo critério que useProducts usa globalmente)
    for (const k of Object.keys(map) as BucketKey[]) {
      map[k].sort(
        (a, b) => (a.position_index ?? 0) - (b.position_index ?? 0),
      );
    }
    return map;
  }, [products]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = parseSid(String(active.id));
    const to = parseSid(String(over.id));
    if (from.bucket !== to.bucket) return; // só reordena dentro do mesmo bucket

    const list = grouped[from.bucket];
    const oldIndex = list.findIndex((p) => p.id === from.productId);
    const newIndex = list.findIndex((p) => p.id === to.productId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedList = arrayMove(list, oldIndex, newIndex);
    // Reatribui os mesmos position_index ocupados (preserva slots globais)
    const positions = list.map((p) => p.position_index ?? 0);
    const updates = reorderedList.map((p, i) => ({
      id: p.id,
      position_index: positions[i],
    }));

    reorder.mutate(updates);
  }

  return (
    <AppShell
      eyebrow="Catálogo"
      title="Produtos — Visão geral"
      flushMain
      footerLeft={
        <>
          <FooterDot color="emerald">{products.length} produtos</FooterDot>
          <FooterDot color="gold">{grouped.new.length} novos (30d)</FooterDot>
        </>
      }
      footerRight={<span>Arraste pelo handle para reordenar dentro do bucket</span>}
    >
      <div className="h-full p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid h-full min-h-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 lg:gap-6">
              {BUCKETS.map((b) => (
                <BucketColumn
                  key={b.key}
                  bucket={b.key}
                  label={b.label}
                  sub={b.sub}
                  products={grouped[b.key]}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </AppShell>
  );
}
