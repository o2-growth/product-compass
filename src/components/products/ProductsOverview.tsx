import { useMemo } from "react";
import { useProducts } from "@/hooks/useScale";
import { AppShell, FooterDot } from "@/components/shell/AppShell";
import {
  STATUS_DOT,
  STATUS_LABEL,
  type Product,
  type ProductStatus,
} from "@/types/scale";
import { cn } from "@/lib/utils";

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

function ProductCard({ product }: { product: Product }) {
  const status = product.status as ProductStatus;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-bg-elev-2 p-4 shadow-sm transition-colors hover:border-white/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/30 text-lg">
          {product.icon || "📦"}
        </div>
        <div className="min-w-0 flex-1">
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
  label,
  sub,
  products,
}: {
  label: string;
  sub: string;
  products: Product[];
}) {
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
          products.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}

export function ProductsOverview() {
  const { data: products = [], isLoading } = useProducts();

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
    // ordena cada bucket por created_at desc
    for (const k of Object.keys(map) as BucketKey[]) {
      map[k].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return map;
  }, [products]);

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
      footerRight={<span>Agrupado por status · ao lado do DIAP</span>}
    >
      <div className="h-full p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 lg:gap-6">
            {BUCKETS.map((b) => (
              <BucketColumn
                key={b.key}
                label={b.label}
                sub={b.sub}
                products={grouped[b.key]}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
