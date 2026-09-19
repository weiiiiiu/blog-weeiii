import type { Root } from "hast";
import { visit } from "unist-util-visit";

export function rehypeImageLoading() {
  return (tree: Root) => {
    let firstImage = true;

    // Fetch the first article image immediately; let the browser defer distant images.
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      node.properties.loading = firstImage ? "eager" : "lazy";
      node.properties.fetchPriority = firstImage ? "high" : "auto";
      node.properties.decoding = "async";
      firstImage = false;
    });
  };
}
