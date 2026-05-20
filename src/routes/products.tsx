import { createFileRoute } from "@tanstack/react-router";
import { ProductsOverview } from "@/components/products/ProductsOverview";

export const Route = createFileRoute("/products")({
  component: ProductsOverview,
  head: () => ({
    meta: [
      { title: "Produtos — Product Compass" },
      {
        name: "description",
        content:
          "Visão geral dos produtos O2 agrupados por status: ativos, em planejamento, novos e futuros.",
      },
    ],
  }),
});
