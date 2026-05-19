import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Value Ladder" },
  { to: "/diap", label: "DIAP" },
  { to: "/orgchart", label: "Organograma" },
] as const;

interface AppShellProps {
  eyebrow?: string;
  title?: string;
  actions?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  flushMain?: boolean;
}

export function AppShell({
  eyebrow = "O2 Inc.",
  title = "Product Compass",
  actions,
  footerLeft,
  footerRight,
  children,
  sidebar,
  flushMain,
}: AppShellProps) {
  const currentPath = useRouterState({
    select: (r) => r.location.pathname,
  });

  return (
    <div className="min-h-dvh bg-[oklch(0.97_0.003_230)] p-3 lg:p-6">
      <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[1700px] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-shell lg:h-[calc(100dvh-3rem)]">
        {/* Top navigation — minimalista, alinhado com site institucional O2 */}
        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-border bg-background px-6 py-4 lg:px-8 lg:py-5">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-deep text-emerald shadow-card">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  {eyebrow}
                </span>
                <h1 className="font-display text-base font-bold tracking-tight text-foreground lg:text-lg">
                  {title}
                </h1>
              </div>
            </div>
            <nav className="flex rounded-full border border-border bg-muted/60 p-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.to === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all lg:px-5 lg:text-xs",
                      isActive
                        ? "bg-emerald-deep text-background shadow-card"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">{actions}</div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {sidebar}
          <main
            className={cn(
              "flex-1 overflow-auto bg-canvas-soft text-foreground",
              !flushMain && "p-6 lg:p-8",
            )}
          >
            {children}
          </main>
        </div>

        {/* Status footer */}
        {(footerLeft || footerRight) && (
          <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:px-8">
            <div className="flex flex-wrap gap-6">{footerLeft}</div>
            <div className="flex flex-wrap gap-4">{footerRight}</div>
          </footer>
        )}
      </div>
    </div>
  );
}

export function FooterDot({
  color = "emerald",
  children,
}: {
  color?: "emerald" | "gold" | "muted";
  children: ReactNode;
}) {
  const cls = color === "muted" ? "bg-muted-foreground/40" : "bg-emerald";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      <span>{children}</span>
    </div>
  );
}
