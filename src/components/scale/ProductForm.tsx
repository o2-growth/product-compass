import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormData, Tier } from "@/types/scale";
import { STATUS_OPTIONS } from "@/hooks/useScale";

const EMPTY: ProductFormData = {
  name: "",
  description: "",
  scope_items: [],
  avg_ticket: null,
  status: "active",
  icon: "📦",
  internal_notes: "",
  tier_ids: [],
};

interface Props {
  initial?: Partial<ProductFormData>;
  tiers: Tier[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function ProductForm({
  initial,
  tiers,
  submitting,
  submitLabel = "Salvar",
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY, ...initial });
  const [newScope, setNewScope] = useState("");

  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
  }, [initial]);

  const update = <K extends keyof ProductFormData>(
    k: K,
    v: ProductFormData[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const addScope = () => {
    const v = newScope.trim();
    if (!v) return;
    update("scope_items", [...form.scope_items, v]);
    setNewScope("");
  };

  const removeScope = (i: number) =>
    update(
      "scope_items",
      form.scope_items.filter((_, idx) => idx !== i),
    );

  const toggleTier = (id: string) => {
    update(
      "tier_ids",
      form.tier_ids.includes(id)
        ? form.tier_ids.filter((x) => x !== id)
        : [...form.tier_ids, id],
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim() });
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <Label htmlFor="icon">Ícone</Label>
            <Input
              id="icon"
              value={form.icon}
              maxLength={4}
              onChange={(e) => update("icon", e.target.value)}
              className="text-center text-xl"
            />
          </div>
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Descrição</Label>
          <Textarea
            id="desc"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div>
          <Label>O que está incluso no escopo</Label>
          <div className="mt-1 space-y-1.5">
            {form.scope_items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
              >
                <span className="flex-1 text-sm">{item}</span>
                <button
                  type="button"
                  onClick={() => removeScope(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar item..."
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addScope();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addScope}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ticket">Ticket médio (R$)</Label>
            <Input
              id="ticket"
              type="number"
              min={0}
              value={form.avg_ticket ?? ""}
              onChange={(e) =>
                update(
                  "avg_ticket",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Tiers</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {tiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <Checkbox
                  checked={form.tier_ids.includes(t.id)}
                  onCheckedChange={() => toggleTier(t.id)}
                />
                <span className="truncate">{t.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notas internas</Label>
          <Textarea
            id="notes"
            rows={2}
            maxLength={1000}
            value={form.internal_notes}
            onChange={(e) => update("internal_notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-background p-4">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
