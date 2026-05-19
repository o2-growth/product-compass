import { createFileRoute } from "@tanstack/react-router";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";

export const Route = createFileRoute("/whiteboard")({
  component: Whiteboard,
  head: () => ({
    meta: [
      { title: "Whiteboard — Product Compass" },
      {
        name: "description",
        content:
          "Canvas livre pra organizar produtos da O2, riscar, escrever post-its e textos — estilo Miro.",
      },
    ],
  }),
});
