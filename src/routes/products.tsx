import { createFileRoute } from "@tanstack/react-router";
import { ProductsTable } from "@/components/products/ProductsTable";

export const Route = createFileRoute("/products")({
  component: ProductsTable,
  head: () => ({
    meta: [
      { title: "Produtos — Product Compass" },
      {
        name: "description",
        content: "Tabela completa do portfólio de produtos O2 Inc.",
      },
    ],
  }),
});
