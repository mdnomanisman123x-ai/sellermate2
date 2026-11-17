import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SellerMate — Business Workspace",
    short_name: "SellerMate",
    description: "A simple business management app for small business owners.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9f7",
    theme_color: "#116b4a",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}