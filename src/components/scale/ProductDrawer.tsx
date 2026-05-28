import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import type { Product, ProductFormData, Tier } from "@/types/scale";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/hooks/useScale";
import {
  useAddDiapPlacement,
  useDiap,
  useRemoveDiapPlacement,
  type DiapColumn,
} from "@/hooks/useDiap";
interface Props {
  mode: "create" | "edit" | null;
  product?: Product;
  defaultTierId?: string;
  defaultLadderTrack?: "b2b" | "b2c" | null;
  defaultLadderGroup?: string;
  defaultStatus?: import("@/types/scale").ProductStatus;
  defaultCategoryId?: string;
  tiers: Tier[];
  onClose: () => void;
  /** "sheet" (padrão) = painel lateral · "dialog" = modal centralizado */
  variant?: "sheet" | "dialog";
}

export function ProductDrawer({
  mode,
  product,
  defaultTierId,
  defaultLadderTrack,
  defaultLadderGroup,
  defaultStatus,
  defaultCategoryId,
  tiers,
  onClose,
  variant = "sheet",
}: Props) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();
  const addDiap = useAddDiapPlacement();
  const removeDiap = useRemoveDiapPlacement();
  const { data: diapColumns = [] } = useDiap();

  const open = mode !== null;

  const currentDiapCols: string[] = product
    ? diapColumns
        .filter((c) => c.products.some((p) => p.product_id === product.id))
        .map((c) => c.column)
    : [];

  const initial: Partial<ProductFormData> | undefined =
    mode === "edit" && product
      ? {
          name: product.name,
          description: product.description ?? "",
          scope_items: product.scope_items,
          avg_ticket: product.avg_ticket,
          status: product.status,
          icon: product.icon,
          internal_notes: product.internal_notes ?? "",
          tier_ids: product.tier_ids,
          ladder_track: product.ladder_track,
          ladder_group: product.ladder_group ?? "",
          ladder_order: product.ladder_order,
          created_by: product.created_by ?? "",
          diap_columns: currentDiapCols,
        }
      : mode === "create"
        ? {
            tier_ids: defaultTierId ? [defaultTierId] : [],
            ladder_track: defaultLadderTrack ?? null,
            ladder_group: defaultLadderGroup ?? "",
            diap_columns: [],
            ...(defaultStatus ? { status: defaultStatus } : {}),
          }
        : undefined;

  const handleSubmit = async (form: ProductFormData) => {
    let productId: string;

    if (mode === "create") {
      const created = await create.mutateAsync(form);
      productId = (created as any).id;
    } else if (mode === "edit" && product) {
      await update.mutateAsync({ id: product.id, form });
      productId = product.id;

      const toRemove = currentDiapCols.filter((c) => !form.diap_columns.includes(c));
      const toAdd = form.diap_columns.filter((c) => !currentDiapCols.includes(c));

      for (const col of toRemove) {
        const colData = diapColumns.find((c) => c.column === col);
        const placement = colData?.products.find((p) => p.product_id === productId);
        if (placement) await removeDiap.mutateAsync(placement.placement_id);
      }
      for (const col of toAdd) {
        await addDiap.mutateAsync({ productId, column: col as DiapColumn });
      }
    } else {
      return;
    }

    if (mode === "create" && productId!) {
      for (const col of form.diap_columns) {
        await addDiap.mutateAsync({ productId: productId!, column: col as DiapColumn });
      }
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Excluir "${product.name}"?`)) return;
    await del.mutateAsync(product.id);
    onClose();
  };

  const title = mode === "create" ? "Novo produto" : "Editar produto";
  const description =
    mode === "create"
      ? "Adicione um produto ao portfólio."
      : "Atualize os detalhes do produto.";

  const formNode = open ? (
    <ProductForm
      initial={initial}
      tiers={tiers}
      submitting={create.isPending || update.isPending}
      submitLabel={mode === "create" ? "Criar produto" : "Salvar"}
      onSubmit={handleSubmit}
      onCancel={onClose}
      onDelete={mode === "edit" ? handleDelete : undefined}
    />
  ) : null;

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formNode}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {formNode}
      </SheetContent>
    </Sheet>
  );
}
