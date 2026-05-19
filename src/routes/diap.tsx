import { createFileRoute } from "@tanstack/react-router";
import { Diap } from "@/components/diap/Diap";

export const Route = createFileRoute("/diap")({
  component: Diap,
  head: () => ({
    meta: [
      { title: "DIAP — Product Compass" },
      {
        name: "description",
        content:
          "Metodologia DIAP da O2: 2P's · D · I · A · P · LUXA. Arraste produtos pras letras correspondentes ao processo de entrada do cliente.",
      },
    ],
  }),
});
