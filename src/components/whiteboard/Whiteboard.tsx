import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  Hand,
  MousePointer2,
  Pencil,
  Type,
  StickyNote,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProducts, useTiers } from "@/hooks/useScale";
import { useWhiteboard, newId } from "@/hooks/useWhiteboard";
import {
  STICKY_COLORS,
  type Tool,
  type WhiteboardItem,
  type ProductItem,
  type StickyItem,
  type TextItem,
  type StrokeItem,
} from "@/types/whiteboard";
import { ProductDrawer } from "@/components/scale/ProductDrawer";
import { STATUS_DOT } from "@/types/scale";

const TOOL_CONFIG: { tool: Tool; icon: any; label: string; key: string }[] = [
  { tool: "hand", icon: Hand, label: "Mover canvas", key: "H" },
  { tool: "select", icon: MousePointer2, label: "Selecionar", key: "V" },
  { tool: "pen", icon: Pencil, label: "Desenhar", key: "P" },
  { tool: "text", icon: Type, label: "Texto", key: "T" },
  { tool: "sticky", icon: StickyNote, label: "Post-it", key: "S" },
];

const PEN_COLORS = ["#000000", "#494949", "#6BF169", "#FF4D4F", "#1E88FF", "#FFB300"];

export function Whiteboard() {
  const { state, hydrated, addItem, updateItem, removeItems, setViewport, clear, bringToFront } =
    useWhiteboard();
  const { data: products = [] } = useProducts();
  const { data: tiers = [] } = useTiers();

  const [tool, setTool] = useState<Tool>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penWidth] = useState(2.5);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    mode: "pan" | "move" | "draw" | null;
    startX: number;
    startY: number;
    initial?: any;
    strokeId?: string;
  }>({ mode: null, startX: 0, startY: 0 });

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (sx - rect.left - state.viewport.x) / state.viewport.scale,
        y: (sy - rect.top - state.viewport.y) / state.viewport.scale,
      };
    },
    [state.viewport],
  );

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).dataset.itemId) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (tool === "hand") {
      draggingRef.current = {
        mode: "pan",
        startX: e.clientX,
        startY: e.clientY,
        initial: { ...state.viewport },
      };
      return;
    }

    if (tool === "select") {
      setSelectedIds([]);
      setEditingId(null);
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    if (tool === "text") {
      const id = newId();
      const item: TextItem = {
        id,
        type: "text",
        x,
        y,
        z: Date.now(),
        text: "",
        w: 220,
        h: 50,
        color: "#1f2937",
        fontSize: 16,
      };
      addItem(item);
      setSelectedIds([id]);
      setEditingId(id);
      setTool("select");
      return;
    }

    if (tool === "sticky") {
      const id = newId();
      const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
      const item: StickyItem = {
        id,
        type: "sticky",
        x: x - 80,
        y: y - 80,
        z: Date.now(),
        text: "",
        w: 160,
        h: 160,
        color,
      };
      addItem(item);
      setSelectedIds([id]);
      setEditingId(id);
      setTool("select");
      return;
    }

    if (tool === "pen") {
      const id = newId();
      const item: StrokeItem = {
        id,
        type: "stroke",
        x: 0,
        y: 0,
        z: Date.now(),
        points: [{ x, y }],
        color: penColor,
        width: penWidth,
      };
      addItem(item);
      draggingRef.current = {
        mode: "draw",
        startX: e.clientX,
        startY: e.clientY,
        strokeId: id,
      };
      return;
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag.mode) return;

    if (drag.mode === "pan") {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setViewport({
        x: drag.initial.x + dx,
        y: drag.initial.y + dy,
        scale: drag.initial.scale,
      });
      return;
    }

    if (drag.mode === "move" && drag.initial) {
      const dx = (e.clientX - drag.startX) / state.viewport.scale;
      const dy = (e.clientY - drag.startY) / state.viewport.scale;
      for (const it of drag.initial as WhiteboardItem[]) {
        updateItem(it.id, { x: it.x + dx, y: it.y + dy } as any);
      }
      return;
    }

    if (drag.mode === "draw" && drag.strokeId) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const stroke = state.items.find((it) => it.id === drag.strokeId);
      if (stroke && stroke.type === "stroke") {
        const last = stroke.points[stroke.points.length - 1];
        if (Math.hypot(x - last.x, y - last.y) > 2) {
          updateItem(drag.strokeId, {
            points: [...stroke.points, { x, y }],
          } as any);
        }
      }
      return;
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current.mode) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      draggingRef.current = { mode: null, startX: 0, startY: 0 };
    }
  };

  const handleItemPointerDown = (e: React.PointerEvent, item: WhiteboardItem) => {
    if (tool !== "select") return;
    e.stopPropagation();
    if (e.button !== 0) return;
    setSelectedIds([item.id]);
    bringToFront(item.id);
    draggingRef.current = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      initial: [item],
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    setViewport((vp) => {
      const next = Math.min(4, Math.max(0.2, vp.scale * (1 + delta)));
      const ratio = next / vp.scale;
      return {
        scale: next,
        x: cx - (cx - vp.x) * ratio,
        y: cy - (cy - vp.y) * ratio,
      };
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if (e.key === "h" || e.key === "H") setTool("hand");
      else if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "p" || e.key === "P") setTool("pen");
      else if (e.key === "t" || e.key === "T") setTool("text");
      else if (e.key === "s" || e.key === "S") setTool("sticky");
      else if ((e.key === "Backspace" || e.key === "Delete") && selectedIds.length > 0) {
        removeItems(selectedIds);
        setSelectedIds([]);
      } else if (e.key === "Escape") {
        setSelectedIds([]);
        setEditingId(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, removeItems]);

  const productById = useMemo(() => {
    const m = new Map<string, (typeof products)[number]>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const cursor =
    tool === "hand"
      ? "grab"
      : tool === "pen"
        ? "crosshair"
        : tool === "text" || tool === "sticky"
          ? "crosshair"
          : "default";

  const dropProductOnCanvas = (productId: string, clientX: number, clientY: number) => {
    const { x, y } = screenToCanvas(clientX, clientY);
    const item: ProductItem = {
      id: newId(),
      type: "product",
      x: x - 110,
      y: y - 50,
      z: Date.now(),
      product_id: productId,
      w: 220,
      h: 100,
    };
    addItem(item);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-background px-6 py-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Home className="h-4 w-4" /> Home
          </Button>
        </Link>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-status-active font-bold text-tier-header">
          O₂
        </div>
        <div>
          <div className="text-sm font-semibold">Whiteboard</div>
          <div className="text-[11px] text-muted-foreground">
            Canvas livre — H/V/P/T/S · Cmd+scroll = zoom · Delete remove
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/ladder">
            <Button variant="outline" size="sm">Ladder</Button>
          </Link>
          <Link to="/orgchart">
            <Button variant="outline" size="sm">Organograma</Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Limpar todo o whiteboard?")) clear();
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" /> Limpar
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Toolbar flutuante — desloca pra depois da sidebar quando aberta */}
        <div
          className={cn(
            "absolute top-4 z-20 flex flex-col gap-1 rounded-xl border bg-background/95 p-1.5 shadow-lg backdrop-blur transition-[left] duration-200",
            sidebarOpen ? "left-[276px]" : "left-4",
          )}
        >
          {TOOL_CONFIG.map(({ tool: t, icon: Icon, label, key }) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={`${label} (${key})`}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                tool === t
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
          {tool === "pen" && (
            <div className="mt-1 flex flex-col gap-1 border-t pt-1.5">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform mx-auto",
                    penColor === c && "ring-2 ring-offset-2 ring-foreground scale-110",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls bottom-left — desloca também */}
        <div
          className={cn(
            "absolute bottom-4 z-20 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur transition-[left] duration-200",
            sidebarOpen ? "left-[276px]" : "left-4",
          )}
        >
          <button
            onClick={() => setViewport((vp) => ({ ...vp, scale: Math.max(0.2, vp.scale - 0.1) }))}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
            title="Zoom -"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[42px] text-center text-xs font-medium tabular-nums">
            {Math.round(state.viewport.scale * 100)}%
          </span>
          <button
            onClick={() => setViewport((vp) => ({ ...vp, scale: Math.min(4, vp.scale + 0.1) }))}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
            title="Zoom +"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
            title="Centralizar"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar de produtos */}
        {sidebarOpen && (
          <aside className="z-10 flex w-[260px] flex-col border-r bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Produtos O2</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="border-b bg-muted/40 px-3 py-1.5 text-[10px] leading-tight text-muted-foreground">
              Arraste um produto pro canvas
            </p>
            <div className="flex-1 overflow-y-auto p-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/o2-product", p.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="mb-1.5 flex cursor-grab items-start gap-2 rounded-md border bg-card p-2 text-left text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                  title="Arraste pro canvas"
                >
                  <span className="text-lg leading-none">{p.icon || "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[p.status])} />
                      <span className="text-[10px] text-muted-foreground">
                        {p.avg_ticket
                          ? `R$ ${p.avg_ticket.toLocaleString("pt-BR")}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-[72px] top-4 z-20 flex h-10 items-center gap-1.5 rounded-lg border bg-background/95 px-3 text-sm font-medium shadow-lg backdrop-blur hover:bg-muted"
          >
            <Package className="h-4 w-4" /> Produtos
          </button>
        )}

        {/* Canvas */}
        <main
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-canvas-soft"
          style={{ cursor }}
          onWheel={handleWheel}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("text/o2-product")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            const pid = e.dataTransfer.getData("text/o2-product");
            if (pid) {
              e.preventDefault();
              dropProductOnCanvas(pid, e.clientX, e.clientY);
            }
          }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
        >
          {/* Transform layer */}
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              transform: `translate3d(${state.viewport.x}px, ${state.viewport.y}px, 0) scale(${state.viewport.scale})`,
              width: 0,
              height: 0,
            }}
          >
            {/* SVG layer pra strokes */}
            <svg
              className="pointer-events-none absolute overflow-visible"
              style={{ left: 0, top: 0, width: 1, height: 1 }}
            >
              {state.items
                .filter((it): it is StrokeItem => it.type === "stroke")
                .sort((a, b) => a.z - b.z)
                .map((s) => (
                  <polyline
                    key={s.id}
                    data-item-id={s.id}
                    points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.width / state.viewport.scale + s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: tool === "select" ? "stroke" : "none" }}
                    onPointerDown={(e) => handleItemPointerDown(e as any, s)}
                    className={cn(selectedIds.includes(s.id) && "drop-shadow-[0_0_4px_rgba(0,0,0,0.4)]")}
                  />
                ))}
            </svg>

            {/* Itens não-stroke */}
            {state.items
              .filter((it) => it.type !== "stroke")
              .sort((a, b) => a.z - b.z)
              .map((item) => {
                const selected = selectedIds.includes(item.id);
                if (item.type === "text") {
                  return (
                    <TextNode
                      key={item.id}
                      item={item}
                      selected={selected}
                      editing={editingId === item.id}
                      onPointerDown={(e) => handleItemPointerDown(e, item)}
                      onChange={(v) => updateItem(item.id, { text: v } as any)}
                      onDoubleClick={() => setEditingId(item.id)}
                      onBlur={() => setEditingId(null)}
                    />
                  );
                }
                if (item.type === "sticky") {
                  return (
                    <StickyNode
                      key={item.id}
                      item={item}
                      selected={selected}
                      editing={editingId === item.id}
                      onPointerDown={(e) => handleItemPointerDown(e, item)}
                      onChange={(v) => updateItem(item.id, { text: v } as any)}
                      onDoubleClick={() => setEditingId(item.id)}
                      onBlur={() => setEditingId(null)}
                    />
                  );
                }
                if (item.type === "product") {
                  const product = productById.get(item.product_id);
                  return (
                    <ProductNode
                      key={item.id}
                      item={item}
                      productName={product?.name ?? "(removido)"}
                      productIcon={product?.icon ?? "📦"}
                      productTicket={product?.avg_ticket ?? null}
                      productStatus={product?.status}
                      selected={selected}
                      onPointerDown={(e) => handleItemPointerDown(e, item)}
                      onOpen={() => product && setDrawerProductId(product.id)}
                    />
                  );
                }
                return null;
              })}
          </div>

          {!hydrated && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Carregando whiteboard...
            </div>
          )}

          {hydrated && state.items.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
              <p className="text-lg font-semibold">Whiteboard vazio</p>
              <p className="mt-1 max-w-[400px]">
                Escolha uma ferramenta à esquerda. Arraste produtos da sidebar pro
                canvas. Cmd+scroll pra zoom. Atalhos: H/V/P/T/S.
              </p>
            </div>
          )}
        </main>
      </div>

      <ProductDrawer
        mode={drawerProductId ? "edit" : null}
        product={drawerProductId ? productById.get(drawerProductId) : undefined}
        tiers={tiers}
        onClose={() => setDrawerProductId(null)}
      />
    </div>
  );
}

/* --------------------------------- Sub-nodes --------------------------------- */

function nodeWrap(item: { x: number; y: number; w: number; h: number; z: number }) {
  return {
    position: "absolute" as const,
    left: item.x,
    top: item.y,
    width: item.w,
    height: item.h,
    zIndex: item.z,
  };
}

function TextNode({
  item,
  selected,
  editing,
  onPointerDown,
  onChange,
  onDoubleClick,
  onBlur,
}: {
  item: TextItem;
  selected: boolean;
  editing: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onChange: (v: string) => void;
  onDoubleClick: () => void;
  onBlur: () => void;
}) {
  return (
    <div
      data-item-id={item.id}
      style={nodeWrap(item)}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "rounded outline-offset-2",
        selected && "outline outline-2 outline-status-active",
      )}
    >
      {editing ? (
        <textarea
          autoFocus
          value={item.text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-full w-full resize-none bg-transparent outline-none"
          style={{ color: item.color, fontSize: item.fontSize, lineHeight: 1.3 }}
          placeholder="Digite..."
        />
      ) : (
        <div
          className="h-full w-full whitespace-pre-wrap"
          style={{ color: item.color, fontSize: item.fontSize, lineHeight: 1.3 }}
        >
          {item.text || <span className="text-muted-foreground">Texto vazio (2× pra editar)</span>}
        </div>
      )}
    </div>
  );
}

function StickyNode({
  item,
  selected,
  editing,
  onPointerDown,
  onChange,
  onDoubleClick,
  onBlur,
}: {
  item: StickyItem;
  selected: boolean;
  editing: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onChange: (v: string) => void;
  onDoubleClick: () => void;
  onBlur: () => void;
}) {
  return (
    <div
      data-item-id={item.id}
      style={{
        ...nodeWrap(item),
        background: item.color,
        boxShadow: "0 8px 20px -10px rgba(0,0,0,0.3)",
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "rounded-sm p-3",
        selected && "ring-2 ring-status-active ring-offset-2",
      )}
    >
      {editing ? (
        <textarea
          autoFocus
          value={item.text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-full w-full resize-none bg-transparent text-sm font-medium leading-tight text-neutral-900 outline-none"
          placeholder="Escreva..."
        />
      ) : (
        <div className="h-full w-full whitespace-pre-wrap text-sm font-medium leading-tight text-neutral-900">
          {item.text || <span className="opacity-50">Post-it (2× pra editar)</span>}
        </div>
      )}
    </div>
  );
}

function ProductNode({
  item,
  productName,
  productIcon,
  productTicket,
  productStatus,
  selected,
  onPointerDown,
  onOpen,
}: {
  item: ProductItem;
  productName: string;
  productIcon: string;
  productTicket: number | null;
  productStatus?: "active" | "development" | "planned";
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onOpen: () => void;
}) {
  return (
    <div
      data-item-id={item.id}
      style={nodeWrap(item)}
      onPointerDown={onPointerDown}
      onDoubleClick={onOpen}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card p-3 shadow-md transition-shadow hover:shadow-lg",
        selected && "ring-2 ring-status-active ring-offset-2",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xl">
          {productIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{productName}</div>
          {productStatus && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[productStatus])} />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {productStatus}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t pt-1.5 text-[11px]">
        <span className="text-muted-foreground">Ticket</span>
        <span className="font-medium tabular-nums">
          {productTicket ? `R$ ${productTicket.toLocaleString("pt-BR")}` : "—"}
        </span>
      </div>
    </div>
  );
}
