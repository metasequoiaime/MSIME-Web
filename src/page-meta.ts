import { useLayoutEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { markdownPath, pageSeo, serializeJsonLd, structuredData } from "../shared/site-seo";

/** Metadata uses the same registry as the static build, including SPA navigation. */
export const usePageMeta = (_title?: string, _description?: string) => {
  const path = useLocation({ select: location => location.pathname });
  const initialPath = useRef(path);
  useLayoutEffect(() => {
    if (path !== initialPath.current) document.documentElement.removeAttribute("data-prerendered");
    const page = pageSeo(path);
    document.title = page.title;
    const meta = (attribute: "name" | "property", name: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, name); document.head.append(element); }
      element.content = content;
    };
    meta("name", "description", page.description);
    meta("name", "robots", page.noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
    for (const prefix of ["og", "twitter"]) {
      meta(prefix === "og" ? "property" : "name", `${prefix}:title`, page.title);
      meta(prefix === "og" ? "property" : "name", `${prefix}:description`, page.description);
    }
    meta("property", "og:url", page.canonical ?? "");
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('link[rel="alternate"][type="text/markdown"]')?.remove();
    if (page.canonical) {
      const canonical = document.createElement("link"); canonical.rel = "canonical"; canonical.href = page.canonical; document.head.append(canonical);
      if (!page.noindex) { const alternate = document.createElement("link"); alternate.rel = "alternate"; alternate.type = "text/markdown"; alternate.href = markdownPath(page.path); alternate.title = "Markdown"; document.head.append(alternate); }
    }
    document.getElementById("site-structured-data")?.remove();
    const data = structuredData(path);
    if (data) { const script = document.createElement("script"); script.id = "site-structured-data"; script.type = "application/ld+json"; script.textContent = serializeJsonLd(data); document.head.append(script); }
  }, [path]);
};
