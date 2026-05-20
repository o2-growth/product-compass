import { createFileRoute } from "@tanstack/react-router";
import { Diap } from "@/components/diap/Diap";

export const Route = createFileRoute("/diap")({
  component: Diap,
  head: () => ({
    meta: [
      { title: "DIAP — Dados · Informação · Análise · Plano de Ação" },
      {
        name: "description",
        content:
          "Metodologia DIAP da O2: Dados → Informação → Análise → Plano de Ação. Arraste produtos pras etapas correspondentes da jornada do cliente.",
      },
    ],
  }),
});
