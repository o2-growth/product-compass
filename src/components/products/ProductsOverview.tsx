import { useMemo, useState } from "react";
import {
  useProducts,
  useReorderProducts,
  useSetProductStatus,
  useTiers,
} from "@/hooks/useScale";
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
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { Button } from "@/components/ui/button";

type BucketKey = "active" | "development" | "new" | "planned";

const BUCKETS: { key: BucketKey; label: string; sub: string }[] = [
  { key: "active", label: "Ativos", sub: "Em operação" },
  { key: "development", label: "Em planejamento", sub: "Em desenvolvimento" },
  { key: "new", label: "Novos", sub: "Criados nos últimos 30 dias" },
  { key: "planned", label: "Futuros", sub: "Planejados / backlog" },
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Buckets que mapeiam direto pra um status (suportam drop pra mover de fase)
const BUCKET_TO_STATUS: Partial<Record<BucketKey, ProductStatus>> = {
  active: "active",
  development: "development",
  planned: "planned",
  // "new" não mapeia — é derivado de created_at
};

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

// IDs: cards = `card::<bucket>::<productId>`; container = `col::<bucket>`
const cardId = (bucket: BucketKey, productId: string) =>
  `card::${bucket}::${productId}`;
const colId = (bucket: BucketKey) => `col::${bucket}`;

function parseId(id: string):
  | { kind: "card"; bucket: BucketKey; productId: string }
  | { kind: "col"; bucket: BucketKey }
  | null {
  const parts = id.split("::");
  if (parts[0] === "card" && parts.length === 3)
    return { kind: "card", bucket: parts[1] as BucketKey, productId: parts[2] };
  if (parts[0] === "col" && parts.length === 2)
    return { kind: "col", bucket: parts[1] as BucketKey };
  return null;
}

function ProductCardInner({
  product,
  dragHandleProps,
  showHandle = true,
}: {
  product: Product;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  showHandle?: boolean;
}) {
  const status = product.status as ProductStatus;
  return (
    <>
      {showHandle && (
        <button
          type="button"
          {...dragHandleProps}
          className="absolute right-2 top-2 cursor-grab rounded-md p-1 text-white/30 opacity-0 transition hover:bg-white/5 hover:text-white/70 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar para reordenar ou mudar de fase"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

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
    </>
  );
}

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
  } = useSortable({
    id: cardId(bucket, product.id),
    data: { bucket, productId: product.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-bg-elev-2 p-4 shadow-sm transition-colors hover:border-white/20",
        isDragging && "opacity-30",
      )}
    >
      <ProductCardInner
        product={product}
        dragHandleProps={{ ...attributes, ...listeners } as any}
      />
    </div>
  );
}

function BucketColumn({
  bucket,
  label,
  sub,
  products,
  isOverColumn,
  isDropAllowed,
}: {
  bucket: BucketKey;
  label: string;
  sub: string;
  products: Product[];
  isOverColumn: boolean;
  isDropAllowed: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: colId(bucket),
    data: { bucket },
  });

  const itemIds = products.map((p) => cardId(bucket, p.id));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 flex-col rounded-3xl border p-4 transition-colors",
        isOverColumn && isDropAllowed
          ? "border-white/40 bg-bg-elev/80"
          : isOverColumn && !isDropAllowed
            ? "border-red-500/40 bg-bg-elev/80"
            : "border-white/10 bg-bg-elev",
      )}
    >
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
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {products.length === 0 ? (
            <div
              className={cn(
                "flex h-32 items-center justify-center rounded-2xl border border-dashed text-xs",
                isOverColumn && isDropAllowed
                  ? "border-white/30 text-white/60"
                  : "border-white/10 text-white/30",
              )}
            >
              {isOverColumn && isDropAllowed
                ? "Soltar aqui"
                : "Nenhum produto"}
            </div>
          ) : (
            products.map((p) => (
              <SortableProductCard key={p.id} product={p} bucket={bucket} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// Detecção customizada: prioriza pointerWithin (mais preciso pra colunas),
// cai pra rectIntersection se nada estiver sob o ponteiro.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

export function ProductsOverview() {
  const { data: products = [], isLoading } = useProducts();
  const reorder = useReorderProducts();
  const setStatus = useSetProductStatus();

  const [activeDrag, setActiveDrag] = useState<{
    bucket: BucketKey;
    productId: string;
  } | null>(null);
  const [overBucket, setOverBucket] = useState<BucketKey | null>(null);

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
    for (const k of Object.keys(map) as BucketKey[]) {
      map[k].sort((a, b) => (a.position_index ?? 0) - (b.position_index ?? 0));
    }
    return map;
  }, [products]);

  const activeProduct = useMemo(
    () =>
      activeDrag ? products.find((p) => p.id === activeDrag.productId) : null,
    [activeDrag, products],
  );

  function handleDragStart(event: DragStartEvent) {
    const parsed = parseId(String(event.active.id));
    if (parsed?.kind === "card")
      setActiveDrag({ bucket: parsed.bucket, productId: parsed.productId });
  }

  function handleDragOver(event: { over: { id: string | number } | null }) {
    if (!event.over) {
      setOverBucket(null);
      return;
    }
    const parsed = parseId(String(event.over.id));
    if (parsed) setOverBucket(parsed.bucket);
  }

  function resetDrag() {
    setActiveDrag(null);
    setOverBucket(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    resetDrag();
    if (!over) return;

    const from = parseId(String(active.id));
    const overParsed = parseId(String(over.id));
    if (!from || from.kind !== "card" || !overParsed) return;

    // Determina bucket de destino e (se houver) produto-alvo na coluna
    const toBucket: BucketKey = overParsed.bucket;
    const toProductId =
      overParsed.kind === "card" ? overParsed.productId : null;

    // Reorder dentro do mesmo bucket
    if (from.bucket === toBucket) {
      if (!toProductId || toProductId === from.productId) return;
      const list = grouped[from.bucket];
      const oldIndex = list.findIndex((p) => p.id === from.productId);
      const newIndex = list.findIndex((p) => p.id === toProductId);
      if (oldIndex < 0 || newIndex < 0) return;
      const reorderedList = arrayMove(list, oldIndex, newIndex);
      const positions = list.map((p) => p.position_index ?? 0);
      const updates = reorderedList.map((p, i) => ({
        id: p.id,
        position_index: positions[i],
      }));
      reorder.mutate(updates);
      return;
    }

    // Cross-bucket: muda status
    const newStatus = BUCKET_TO_STATUS[toBucket];
    if (!newStatus) {
      toast.error(
        "Não dá pra mover pra 'Novos' — esse bucket é automático (últimos 30d).",
      );
      return;
    }

    // Posição alvo: usa position_index do produto sobre o qual foi solto,
    // ou max+1 da coluna alvo (no fim) se solto na própria coluna.
    const targetList = grouped[toBucket];
    let newPosition: number;
    if (toProductId) {
      const target = targetList.find((p) => p.id === toProductId);
      newPosition = target?.position_index ?? 0;
    } else {
      const maxPos = targetList.reduce(
        (m, p) => Math.max(m, p.position_index ?? 0),
        0,
      );
      newPosition = maxPos + 1;
    }

    setStatus.mutate({
      id: from.productId,
      status: newStatus,
      position_index: newPosition,
    });
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
      footerRight={
        <span>Arraste pelo handle para reordenar ou mudar de fase</span>
      }
    >
      <div className="h-full p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={resetDrag}
          >
            <div className="grid h-full min-h-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 lg:gap-6">
              {BUCKETS.map((b) => (
                <BucketColumn
                  key={b.key}
                  bucket={b.key}
                  label={b.label}
                  sub={b.sub}
                  products={grouped[b.key]}
                  isOverColumn={overBucket === b.key && activeDrag !== null}
                  isDropAllowed={
                    activeDrag?.bucket === b.key ||
                    BUCKET_TO_STATUS[b.key] !== undefined
                  }
                />
              ))}
            </div>
            <DragOverlay>
              {activeProduct ? (
                <div className="relative flex w-72 flex-col gap-3 rounded-2xl border border-white/30 bg-bg-elev-2 p-4 shadow-xl">
                  <ProductCardInner
                    product={activeProduct}
                    showHandle={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </AppShell>
  );
}
