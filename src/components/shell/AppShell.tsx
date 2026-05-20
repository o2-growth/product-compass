import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import logoWhite from "@/assets/o2/logo-white.png";

const NAV_ITEMS = [
  { to: "/", label: "Value Ladder" },
  { to: "/diap", label: "DIAP" },
] as const;

interface AppShellProps {
  /** Pequeno eyebrow no header — ex.: "Plataforma" */
  eyebrow?: string;
  /** Título da view atual no header */
  title?: string;
  /** Slot pra ações no canto direito do header (botões, toggles) */
  actions?: ReactNode;
  /** Status bar inferior — left + right */
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  /** Conteúdo principal */
  children: ReactNode;
  /** Sidebar opcional renderizada à esquerda do main */
  sidebar?: ReactNode;
  /** Remove padding interno do main (quando o conteúdo gerencia o próprio) */
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
    <div className="min-h-dvh bg-bg p-3 lg:p-6">
      <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[1700px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-bg-elev shadow-shell lg:h-[calc(100dvh-3rem)]">
        {/* Top Navigation Bar */}
        <header className="flex shrink-0 items-center justify-between gap-6 bg-bg-elev-2 px-6 py-4 lg:px-10 lg:py-5">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-3">
              <img src={logoWhite} alt="O2 Inc." className="h-7 w-auto" />
              <div className="hidden flex-col leading-tight border-l border-white/15 pl-3 lg:flex">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  {eyebrow}
                </span>
                <h1 className="font-display text-base font-normal uppercase tracking-wide text-white lg:text-lg">
                  {title}
                </h1>
              </div>
            </div>
            <nav className="flex rounded-full bg-black/25 p-1">
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
                      "rounded-full px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-all lg:px-5",
                      isActive
                        ? "bg-accent text-accent-foreground shadow-lg shadow-black/30"
                        : "text-white/55 hover:text-white",
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
              "flex-1 overflow-auto bg-canvas-soft",
              !flushMain && "p-6 lg:p-8",
            )}
          >
            {children}
          </main>
        </div>

        {/* Status footer */}
        {(footerLeft || footerRight) && (
          <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-bg-elev-2 px-6 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white/45 lg:px-10">
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
  const cls =
    color === "gold" ? "bg-accent" : color === "muted" ? "bg-white/25" : "bg-accent";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      <span>{children}</span>
    </div>
  );
}
