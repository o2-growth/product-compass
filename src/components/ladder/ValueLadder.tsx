import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLadder, TRACK_TITLE, type LadderTrack } from "@/hooks/useLadder";
import { LadderStep } from "./LadderStep";

export function ValueLadder() {
  const [track, setTrack] = useState<LadderTrack>("b2b");
  const { data: groups = [], isLoading } = useLadder(track);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Kanban
            </Button>
          </Link>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-status-active font-bold text-tier-header">
            O₂
          </div>
          <div>
            <div className="text-sm font-semibold">Value Ladder</div>
            <div className="text-[11px] text-muted-foreground">O2 Inc.</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          {(["b2b", "b2c"] as LadderTrack[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={[
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                track === t
                  ? "bg-status-active text-tier-header shadow"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Canvas */}
      <main className="relative flex-1 overflow-auto">
        <div
          className="relative mx-auto h-full min-h-[800px] w-full min-w-[1700px]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {/* Title */}
          <h1 className="absolute left-1/2 top-6 -translate-x-1/2 text-2xl font-bold text-foreground">
            {TRACK_TITLE[track]}
          </h1>

          {/* Y axis (PREÇO) */}
          <div className="absolute bottom-12 left-16 top-20">
            <div className="relative h-full w-px bg-foreground">
              {/* Arrow head */}
              <div
                className="absolute -left-[5px] -top-1 h-0 w-0"
                style={{
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderBottom: "10px solid currentColor",
                }}
              />
              <span className="absolute -top-7 -left-3 text-xs font-bold tracking-wider text-foreground">
                PREÇO
              </span>
            </div>
          </div>

          {/* X axis (VALOR) */}
          <div className="absolute bottom-12 left-16 right-12">
            <div className="relative h-px w-full bg-foreground">
              <div
                className="absolute -right-1 -top-[5px] h-0 w-0"
                style={{
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: "10px solid currentColor",
                }}
              />
              <span className="absolute -bottom-5 right-0 text-xs font-bold tracking-wider text-foreground">
                VALOR
              </span>
            </div>
          </div>

          {/* Steps area — inside the axes */}
          <div className="absolute bottom-14 left-24 right-16 top-24">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Nenhum produto classificado nesta trilha.
              </div>
            ) : (
              groups.map((g, i) => (
                <LadderStep
                  key={g.name}
                  group={g}
                  stepIndex={i}
                  totalSteps={groups.length}
                  track={track}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
