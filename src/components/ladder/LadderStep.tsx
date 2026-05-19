import type { LadderGroup, LadderTrack } from "@/hooks/useLadder";
import { TRACK_SUBTITLE, formatTicket } from "@/hooks/useLadder";

interface Props {
  group: LadderGroup;
  stepIndex: number;
  totalSteps: number;
  track: LadderTrack;
}

/**
 * A single "step" of the value ladder — rendered as a yellow post-it
 * containing the group's title and a row of green product cards.
 * Positioned absolutely on the canvas so it climbs to the right & up.
 */
export function LadderStep({ group, stepIndex, totalSteps, track }: Props) {
  // Step layout: each step climbs to the right + up.
  // Use smaller increments so big groups don't overflow the canvas.
  const xStep = 13; // % per step
  const yStep = 14; // % per step
  const left = `${3 + stepIndex * xStep}%`;
  const bottom = `${4 + stepIndex * yStep}%`;
  void totalSteps;

  const subtitle = TRACK_SUBTITLE[track]?.[group.name];

  return (
    <div
      className="absolute"
      style={{ left, bottom, transform: "translateZ(0)" }}
    >
      {/* Group title */}
      <div className="mb-2 px-1">
        <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
          {group.name}
        </h3>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {/* Yellow post-it */}
      <div
        className="rounded-sm p-2.5 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)]"
        style={{
          background: "#FEF3A0",
          minWidth: group.products.length * 108 + 20,
        }}
      >
        {/* Tickets row */}
        <div className="mb-1.5 flex gap-1.5">
          {group.products.map((p) => (
            <div
              key={`t-${p.id}`}
              className="w-[100px] text-[10px] font-medium leading-tight text-neutral-700"
            >
              {formatTicket(p.avg_ticket)}
            </div>
          ))}
        </div>

        {/* Green product cards */}
        <div className="flex gap-1.5">
          {group.products.map((p) => (
            <div
              key={p.id}
              className="flex h-[96px] w-[100px] flex-col rounded-sm p-1.5 shadow-sm"
              style={{ background: "#A8E66C" }}
              title={p.name}
            >
              <div className="text-base leading-none">{p.icon || "📦"}</div>
              <div className="mt-1 line-clamp-3 text-[10px] font-semibold leading-tight text-neutral-900">
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
