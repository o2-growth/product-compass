import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@/components/scale/Canvas";

export const Route = createFileRoute("/")({
  component: Canvas,
  head: () => ({
    meta: [
      { title: "Product Scale Platform — O2 Inc." },
      {
        name: "description",
        content:
          "Plataforma interna da O2 Inc. para visualizar e gerir o portfólio de produtos por tier de faturamento.",
      },
    ],
  }),
});
