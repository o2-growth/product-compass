import { createFileRoute } from "@tanstack/react-router";
import { ValueLadder } from "@/components/ladder/ValueLadder";

export const Route = createFileRoute("/ladder")({
  component: ValueLadder,
  head: () => ({
    meta: [
      { title: "Value Ladder — O2 Inc." },
      {
        name: "description",
        content:
          "Escada de valor da O2 Inc.: visualize os produtos organizados por preço e valor entregue.",
      },
    ],
  }),
});
