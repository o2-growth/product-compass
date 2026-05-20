import { ChevronDown, ChevronRight } from "lucide-react";
import type { Product } from "@/types/scale";
import { STATUS_DOT, STATUS_LABEL } from "@/types/scale";

type Variant = "root" | "group" | "leaf";

interface BaseProps {
  variant: Variant;
  label: string;
  icon?: string;
  subtitle?: string;
  childCount?: number;
  collapsed?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  product?: Product;
}

const variantClasses: Record<Variant, string> = {
  root: "bg-status-active text-tier-header border-status-active shadow-md min-w-[180px]",
  group:
    "bg-card text-foreground border-2 border-border shadow-sm min-w-[200px] hover:border-status-active/60",
  leaf: "bg-card text-foreground border border-border shadow-sm min-w-[200px] hover:border-status-active/60 hover:shadow-md",
};

function formatTicket(value: number | null | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrgNode({
  variant,
  label,
  icon,
  subtitle,
  childCount,
  collapsed,
  onToggle,
  onClick,
  product,
}: BaseProps) {
  const ticket = formatTicket(product?.avg_ticket);

  return (
    <div
      onClick={onClick}
      className={[
        "relative inline-flex flex-col gap-1 rounded-xl px-4 py-3 transition-all",
        variantClasses[variant],
        onClick ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={[
              "text-lg leading-none",
              variant === "root" ? "" : "",
            ].join(" ")}
          >
            {icon}
          </span>
        )}
        <span
          className={[
            "flex-1 truncate text-sm font-semibold",
            variant === "root" ? "uppercase tracking-wider" : "",
          ].join(" ")}
        >
          {label}
        </span>

        {variant === "leaf" && product && (
          <span
            className={[
              "h-2 w-2 shrink-0 rounded-full",
              STATUS_DOT[product.status],
            ].join(" ")}
            title={STATUS_LABEL[product.status]}
          />
        )}

        {onToggle && (childCount ?? 0) > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={[
              "ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
              variant === "root"
                ? "hover:bg-bg-elev/20"
                : "hover:bg-muted",
            ].join(" ")}
            aria-label={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {subtitle && (
        <div
          className={[
            "text-[11px]",
            variant === "root"
              ? "text-tier-header/80"
              : "text-muted-foreground",
          ].join(" ")}
        >
          {subtitle}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {ticket && variant === "leaf" && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {ticket}
          </span>
        )}
        {typeof childCount === "number" && variant !== "leaf" && (
          <span
            className={[
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
              variant === "root"
                ? "bg-bg-elev/20 text-tier-header"
                : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            {childCount}
          </span>
        )}
      </div>
    </div>
  );
}
