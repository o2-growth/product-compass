import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  /** When true, render an input that auto-fits the text width. */
  multiline?: boolean;
  maxLength?: number;
  /** Show pencil icon on hover (default true). */
  showIcon?: boolean;
  /** Accessible label for the edit button. */
  ariaLabel?: string;
  /** Wrapper element — span by default. Use 'div' for block-level. */
  as?: "span" | "div";
  /** When true, wrap text in up to 2 lines instead of truncating. */
  clamp?: boolean;
}

/**
 * Inline text editor.
 * - Click pencil OR double-click to edit
 * - Enter or blur to save, Esc to cancel
 * - Empty value is ignored (keeps original)
 */
export function EditableText({
  value,
  onSave,
  className,
  inputClassName,
  multiline,
  maxLength = 200,
  showIcon = true,
  ariaLabel = "Editar",
  as = "span",
  clamp = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) {
      void onSave(next);
    } else {
      setDraft(value);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const Wrapper: any = as;

  if (editing) {
    const common = {
      ref: inputRef as any,
      value: draft,
      maxLength,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onClick: stop,
      onMouseDown: stop,
      onPointerDown: stop,
      onKeyDown: (e: React.KeyboardEvent) => {
        stop(e);
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      className: cn(
        "w-full min-w-0 rounded border border-gold bg-white px-1 py-0.5 text-inherit font-inherit outline-none focus:ring-1 focus:ring-gold",
        inputClassName,
      ),
    };
    return multiline ? (
      <textarea rows={2} {...(common as any)} />
    ) : (
      <input type="text" {...(common as any)} />
    );
  }

  return (
    <Wrapper
      className={cn("group/edit inline-flex items-center gap-1", className)}
      onDoubleClick={(e: React.MouseEvent) => {
        stop(e);
        setEditing(true);
      }}
      title="Duplo-clique para editar"
    >
      <span className="min-w-0 truncate">{value}</span>
      {showIcon && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setEditing(true);
          }}
          onMouseDown={stop}
          onPointerDown={stop}
          className="shrink-0 rounded p-0.5 text-current opacity-0 transition-opacity hover:bg-black/5 group-hover/edit:opacity-60 hover:opacity-100"
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </Wrapper>
  );
}
