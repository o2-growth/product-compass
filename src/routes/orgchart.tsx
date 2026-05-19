import { createFileRoute } from "@tanstack/react-router";
import { OrgChart } from "@/components/orgchart/OrgChart";

export const Route = createFileRoute("/orgchart")({
  component: OrgChart,
  head: () => ({
    meta: [
      { title: "Organograma — O2 Inc." },
      {
        name: "description",
        content:
          "Organograma hierárquico do portfólio O2 Inc.: trilhas, grupos e produtos em árvore.",
      },
    ],
  }),
});
