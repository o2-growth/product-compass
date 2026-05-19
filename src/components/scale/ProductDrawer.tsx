import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProductForm } from "./ProductForm";
import type { Product, ProductFormData, Tier } from "@/types/scale";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/hooks/useScale";

interface Props {
  mode: "create" | "edit" | null;
  product?: Product;
  defaultTierId?: string;
  defaultLadderTrack?: "b2b" | "b2c" | null;
  defaultLadderGroup?: string;
  tiers: Tier[];
  onClose: () => void;
}

export function ProductDrawer({
  mode,
  product,
  defaultTierId,
  defaultLadderTrack,
  defaultLadderGroup,
  tiers,
  onClose,
}: Props) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();

  const open = mode !== null;

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
        }
      : mode === "create"
        ? {
            tier_ids: defaultTierId ? [defaultTierId] : [],
            ladder_track: defaultLadderTrack ?? null,
            ladder_group: defaultLadderGroup ?? "",
          }
        : undefined;

  const handleSubmit = async (form: ProductFormData) => {
    if (mode === "create") {
      await create.mutateAsync(form);
    } else if (mode === "edit" && product) {
      await update.mutateAsync({ id: product.id, form });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Excluir "${product.name}"?`)) return;
    await del.mutateAsync(product.id);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>
            {mode === "create" ? "Novo produto" : "Editar produto"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Adicione um produto ao portfólio."
              : "Atualize os detalhes do produto."}
          </SheetDescription>
        </SheetHeader>

        {open && (
          <ProductForm
            initial={initial}
            tiers={tiers}
            submitting={create.isPending || update.isPending}
            submitLabel={mode === "create" ? "Criar produto" : "Salvar"}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={mode === "edit" ? handleDelete : undefined}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
