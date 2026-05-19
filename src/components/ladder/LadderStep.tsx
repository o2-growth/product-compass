import type { LadderGroup, LadderTrack } from "@/hooks/useLadder";
import { TRACK_SUBTITLE, formatTicket } from "@/hooks/useLadder";

const CARD_W = 108;
const CARD_GAP = 6;
const PAD = 10;

interface Props {
  group: LadderGroup;
  leftPx: number;
  stepIndex: number;
  track: LadderTrack;
}

export function LadderStep({ group, leftPx, stepIndex, track }: Props) {
  // Each step climbs vertically as it moves right
  const bottom = `${60 + stepIndex * 110}px`;
  const subtitle = TRACK_SUBTITLE[track]?.[group.name];

  return (
    <div
      className="absolute"
      style={{ left: `${leftPx}px`, bottom }}
    >
      <div className="mb-2 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {group.name}
        </h3>
        {subtitle && (
          <p className="text-[11px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className="rounded-sm shadow-[0_8px_20px_-10px_rgba(0,0,0,0.3)]"
        style={{
          background: "#FEF3A0",
          padding: PAD,
          width: group.products.length * CARD_W + (group.products.length - 1) * CARD_GAP + PAD * 2,
        }}
      >
        <div className="mb-1.5 flex" style={{ gap: CARD_GAP }}>
          {group.products.map((p) => (
            <div
              key={`t-${p.id}`}
              className="text-[10px] font-medium leading-tight text-neutral-700"
              style={{ width: CARD_W }}
            >
              {formatTicket(p.avg_ticket)}
            </div>
          ))}
        </div>

        <div className="flex" style={{ gap: CARD_GAP }}>
          {group.products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-sm p-1.5 shadow-sm"
              style={{ background: "#A8E66C", width: CARD_W, height: 96 }}
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

export function getStepWidth(productsCount: number): number {
  return productsCount * CARD_W + (productsCount - 1) * CARD_GAP + PAD * 2;
}

export function getStepLefts(groups: LadderGroup[]): number[] {
  // Each step starts slightly to the right of the previous step's left,
  // creating a staircase. Offset = max(step-width * 0.45, 140px).
  const lefts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < groups.length; i++) {
    lefts.push(cursor);
    const w = getStepWidth(groups[i].products.length);
    cursor += Math.max(w * 0.6, 180);
  }
  return lefts;
}
