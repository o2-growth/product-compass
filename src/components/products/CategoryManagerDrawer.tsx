import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCategories,
  useSubcategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from "@/hooks/useCategories";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CategoryManagerDrawer({ open, onClose }: Props) {
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createSub = useCreateSubcategory();
  const updateSub = useUpdateSubcategory();
  const deleteSub = useDeleteSubcategory();

  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    await createCat.mutateAsync({
      name,
      order_index: categories.length + 1,
    });
    setNewCatName("");
  };

  const handleAddSub = async (categoryId: string) => {
    const name = (newSubName[categoryId] ?? "").trim();
    if (!name) return;
    await createSub.mutateAsync({
      category_id: categoryId,
      name,
      order_index: subcategories.filter((s) => s.category_id === categoryId).length + 1,
    });
    setNewSubName((m) => ({ ...m, [categoryId]: "" }));
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Gerenciar categorias</SheetTitle>
          <SheetDescription>
            Crie, renomeie e organize categorias e subcategorias. Produtos vinculados ficam sem categoria ao excluir.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button onClick={handleAddCategory} disabled={!newCatName.trim() || createCat.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {categories.map((cat) => {
            const subs = subcategories.filter((s) => s.category_id === cat.id);
            return (
              <div key={cat.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={cat.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== cat.name) updateCat.mutate({ id: cat.id, name: v });
                    }}
                    className="h-8 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir categoria "${cat.name}"? Subcategorias também serão removidas e produtos ficam sem categoria.`))
                        deleteCat.mutate(cat.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 pl-3">
                  {subs.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Input
                        defaultValue={s.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== s.name) updateSub.mutate({ id: s.id, name: v });
                        }}
                        className="h-7 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir subcategoria "${s.name}"?`)) deleteSub.mutate(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Excluir subcategoria"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="+ Nova subcategoria..."
                      value={newSubName[cat.id] ?? ""}
                      onChange={(e) =>
                        setNewSubName((m) => ({ ...m, [cat.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSub(cat.id);
                        }
                      }}
                      className="h-7 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddSub(cat.id)}
                      disabled={!(newSubName[cat.id] ?? "").trim() || createSub.isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t bg-background p-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
