import { useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  GripVertical,
  ArrowUpDown,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
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
import { AppShell, FooterDot } from "@/components/shell/AppShell";
import {
  useProducts,
  useReorderProducts,
  useSetProductStatus,
  useTiers,
} from "@/hooks/useScale";
import { useDiap } from "@/hooks/useDiap";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  STATUS_DOT,
  STATUS_LABEL,
  type Product,
  type ProductStatus,
} from "@/types/scale";
import { STATUS_OPTIONS } from "@/hooks/useScale";
import { formatTicket } from "@/hooks/useLadder";
import { cn } from "@/lib/utils";

type SortKey = "name" | "status" | "avg_ticket" | "created_at";
type SortDir = "asc" | "desc";

const STATUS_FILTER_OPTIONS: { value: ProductStatus | "all"; label: string }[] =
  [
    { value: "all", label: "Todos" },
    { value: "active", label: "Ativos" },
    { value: "development", label: "Em desenvolvimento" },
    { value: "planned", label: "Planejados" },
  ];

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 font-semibold transition-colors hover:text-white"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

function StatusCell({ product }: { product: Product }) {
  const setStatus = useSetProductStatus();
  return (
    <Select
      value={product.status}
      onValueChange={(v) =>
        setStatus.mutate({ id: product.id, status: v as ProductStatus })
      }
    >
      <SelectTrigger
        className="h-7 w-auto gap-1.5 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:bg-white/5 focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            STATUS_DOT[product.status],
          )}
        />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RowCells({
  product,
  tierMap,
  diapByProduct,
  reorderMode,
  onEdit,
}: {
  product: Product;
  tierMap: Map<string, string>;
  diapByProduct: Map<string, string[]>;
  reorderMode: boolean;
  onEdit: (id: string) => void;
}) {
  const b2b = (() => {
    const pl = product.ladder_placements?.filter(
      (lp) => lp.ladder_track === "b2b",
    );
    if (pl?.length) return pl.map((lp) => lp.ladder_group).join(", ");
    if (product.ladder_track === "b2b" && product.ladder_group)
      return product.ladder_group;
    return null;
  })();

  const b2c = (() => {
    const pl = product.ladder_placements?.filter(
      (lp) => lp.ladder_track === "b2c",
    );
    if (pl?.length) return pl.map((lp) => lp.ladder_group).join(", ");
    if (product.ladder_track === "b2c" && product.ladder_group)
      return product.ladder_group;
    return null;
  })();

  const diap = diapByProduct.get(product.id) ?? [];
  const tierNames = product.tier_ids
    .map((id) => tierMap.get(id))
    .filter(Boolean) as string[];

  return (
    <>
      <TableCell className="text-center text-base">{product.icon}</TableCell>

      <TableCell>
        <div className="font-medium text-white">{product.name}</div>
        {product.created_by && (
          <div className="mt-0.5 text-[10px] text-white/35">
            {product.created_by}
          </div>
        )}
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <StatusCell product={product} />
      </TableCell>

      <TableCell className="text-right font-mono text-sm tabular-nums">
        {product.avg_ticket != null ? (
          formatTicket(product.avg_ticket)
        ) : (
          <span className="text-white/30">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1">
          {tierNames.length > 0 ? (
            tierNames.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="border-white/20 px-1.5 py-0 text-[10px] text-white/60"
              >
                {t}
              </Badge>
            ))
          ) : (
            <span className="text-white/30">—</span>
          )}
        </div>
      </TableCell>

      <TableCell>
        {b2b ? (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-300"
          >
            {b2b}
          </Badge>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </TableCell>

      <TableCell>
        {b2c ? (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[10px] text-blue-300"
          >
            {b2c}
          </Badge>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1">
          {diap.length > 0 ? (
            diap.map((col) => (
              <Badge
                key={col}
                variant="outline"
                className="border-gold/30 bg-gold/10 px-1.5 py-0 font-mono text-[10px] text-yellow-300"
              >
                {col}
              </Badge>
            ))
          ) : (
            <span className="text-white/30">—</span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-xs text-white/40">
        {product.created_by || <span className="text-white/20">—</span>}
      </TableCell>

      {!reorderMode && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(product.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
            aria-label="Editar produto"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </TableCell>
      )}
    </>
  );
}

function SortableRow({
  product,
  tierMap,
  diapByProduct,
  onEdit,
}: {
  product: Product;
  tierMap: Map<string, string>;
  diapByProduct: Map<string, string[]>;
  onEdit: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group border-white/5 transition-colors hover:bg-white/5"
    >
      {/* Drag handle */}
      <TableCell className="w-8 px-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-white/25 transition-colors hover:text-white/60 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <RowCells
        product={product}
        tierMap={tierMap}
        diapByProduct={diapByProduct}
        reorderMode={true}
        onEdit={onEdit}
      />
    </TableRow>
  );
}

export function ProductsTable() {
  const { data: products = [], isLoading } = useProducts();
  const { data: tiers = [] } = useTiers();
  const { data: diapColumns = [] } = useDiap();
  const reorder = useReorderProducts();

  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [reorderMode, setReorderMode] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const tierMap = useMemo(
    () => new Map(tiers.map((t) => [t.id, t.name])),
    [tiers],
  );

  const diapByProduct = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const col of diapColumns) {
      for (const p of col.products) {
        if (!map.has(p.product_id)) map.set(p.product_id, []);
        map.get(p.product_id)!.push(col.column);
      }
    }
    return map;
  }, [diapColumns]);

  const editingProduct = useMemo(
    () => (editingId ? products.find((p) => p.id === editingId) : undefined),
    [editingId, products],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const rows = useMemo(() => {
    let list = [...products];

    if (statusFilter !== "all")
      list = list.filter((p) => p.status === statusFilter);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));

    if (reorderMode) {
      list.sort((a, b) => (a.position_index ?? 0) - (b.position_index ?? 0));
    } else {
      list.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name, "pt-BR");
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        else if (sortKey === "avg_ticket")
          cmp = (a.avg_ticket ?? 0) - (b.avg_ticket ?? 0);
        else if (sortKey === "created_at")
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [products, statusFilter, query, sortKey, sortDir, reorderMode]);

  const openEdit = (id: string) => {
    setEditingId(id);
    setDrawerMode("edit");
  };

  const openCreate = () => {
    setEditingId(undefined);
    setDrawerMode("create");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingId(undefined);
  };

  function handleDragStart(e: DragStartEvent) {
    const p = products.find((x) => x.id === String(e.active.id));
    if (p) setActiveProduct(p);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveProduct(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((p) => p.id === active.id);
    const newIndex = rows.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(rows, oldIndex, newIndex);
    reorder.mutate(reordered.map((p, i) => ({ id: p.id, position_index: i })));
  }

  return (
    <>
      <AppShell
        eyebrow="Catálogo"
        title="Produtos"
        flushMain
        actions={
          <Button
            size="sm"
            className="gap-1.5 rounded-full bg-gold px-4 text-white hover:bg-gold/90"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
        footerLeft={
          <FooterDot color="emerald">
            {rows.length} de {products.length} produtos
          </FooterDot>
        }
        footerRight={
          <span>
            {reorderMode
              ? "Arraste as linhas para reordenar · clique em Concluir quando terminar"
              : "Clique na linha para editar · status editável direto na tabela"}
          </span>
        }
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveProduct(null)}
        >
          <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-6 py-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar produto..."
                  className="h-8 rounded-full border-white/10 bg-white/5 pl-9 text-xs"
                  disabled={reorderMode}
                />
              </div>

              {!reorderMode && (
                <div className="flex items-center gap-1 rounded-full bg-black/25 p-1">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(opt.value as ProductStatus | "all")
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                        statusFilter === opt.value
                          ? "bg-accent text-accent-foreground shadow"
                          : "text-white/55 hover:text-white",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setReorderMode((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                    reorderMode
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-white/15 text-white/55 hover:border-white/30 hover:text-white",
                  )}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {reorderMode ? "Concluir" : "Reordenar"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : rows.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      {reorderMode && <TableHead className="w-8" />}
                      <TableHead className="w-10" />
                      <TableHead className="min-w-[200px] text-white/50">
                        {reorderMode ? (
                          <span className="font-semibold text-white/50">Nome</span>
                        ) : (
                          <SortHeader
                            label="Nome"
                            sortKey="name"
                            current={sortKey}
                            dir={sortDir}
                            onSort={handleSort}
                          />
                        )}
                      </TableHead>
                      <TableHead className="text-white/50">
                        {reorderMode ? (
                          <span className="font-semibold text-white/50">Status</span>
                        ) : (
                          <SortHeader
                            label="Status"
                            sortKey="status"
                            current={sortKey}
                            dir={sortDir}
                            onSort={handleSort}
                          />
                        )}
                      </TableHead>
                      <TableHead className="text-right text-white/50">
                        {reorderMode ? (
                          <span className="font-semibold text-white/50">Ticket</span>
                        ) : (
                          <SortHeader
                            label="Ticket"
                            sortKey="avg_ticket"
                            current={sortKey}
                            dir={sortDir}
                            onSort={handleSort}
                          />
                        )}
                      </TableHead>
                      <TableHead className="text-white/50">Tiers</TableHead>
                      <TableHead className="text-white/50">B2B</TableHead>
                      <TableHead className="text-white/50">B2C</TableHead>
                      <TableHead className="text-white/50">DIAP</TableHead>
                      <TableHead className="text-white/50">Por</TableHead>
                      {!reorderMode && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  {reorderMode ? (
                    <SortableContext
                      items={rows.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>
                        {rows.map((product) => (
                          <SortableRow
                            key={product.id}
                            product={product}
                            tierMap={tierMap}
                            diapByProduct={diapByProduct}
                            onEdit={openEdit}
                          />
                        ))}
                      </TableBody>
                    </SortableContext>
                  ) : (
                    <TableBody>
                      {rows.map((product) => (
                        <TableRow
                          key={product.id}
                          onClick={() => openEdit(product.id)}
                          className="group cursor-pointer border-white/5 transition-colors hover:bg-white/5"
                        >
                          <RowCells
                            product={product}
                            tierMap={tierMap}
                            diapByProduct={diapByProduct}
                            reorderMode={false}
                            onEdit={openEdit}
                          />
                        </TableRow>
                      ))}
                    </TableBody>
                  )}
                </Table>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeProduct ? (
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr className="flex items-center rounded-md border border-white/20 bg-bg-elev shadow-xl">
                    <td className="w-8 px-2">
                      <GripVertical className="h-4 w-4 text-white/40" />
                    </td>
                    <td className="px-4 py-2 text-base">{activeProduct.icon}</td>
                    <td className="px-4 py-2 font-medium text-white">
                      {activeProduct.name}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      </AppShell>

      <ProductDrawer
        mode={drawerMode}
        product={editingProduct}
        tiers={tiers}
        onClose={closeDrawer}
        variant="dialog"
      />
    </>
  );
}
