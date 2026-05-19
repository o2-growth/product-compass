import { createFileRoute } from "@tanstack/react-router";
import { ValueLadder } from "@/components/ladder/ValueLadder";

export const Route = createFileRoute("/")({
  component: ValueLadder,
  head: () => ({
    meta: [
      { title: "Product Scale Platform — O2 Inc." },
      {
        name: "description",
        content:
          "Plataforma interna da O2 Inc. para visualizar e gerir o portfólio de produtos.",
      },
    ],
  }),
});
