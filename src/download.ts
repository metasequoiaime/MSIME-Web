import MarkdownIt from "markdown-it";
import downloadSource from "./content/download.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const RELEASES_PAGE_URL = "https://github.com/metasequoiaime/MSIME-Windows/releases";

type UpdateManifest = {
  version?: unknown;
  releaseUrl?: unknown;
};

const downloadContent = document.getElementById("download-content");

const isValidVersion = (value: unknown): value is string =>
  typeof value === "string" && /^\d+(?:\.\d+)*$/.test(value);

const isValidReleaseUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (value === RELEASES_PAGE_URL || value.startsWith(`${RELEASES_PAGE_URL}/`));

const loadRelease = async () => {
  if (!(downloadContent instanceof HTMLElement)) {
    return;
  }

  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  try {
    const response = await fetch(`/update.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Update manifest returned ${response.status}`);

    const manifest = await response.json() as UpdateManifest;
    if (!isValidVersion(manifest.version) || !isValidReleaseUrl(manifest.releaseUrl)) {
      throw new Error("Invalid update manifest");
    }

    const content = downloadSource
      .replaceAll("{{version}}", manifest.version)
      .replaceAll("{{releaseUrl}}", manifest.releaseUrl);
    downloadContent.innerHTML = markdown.render(content);
  } catch (error) {
    console.warn("[download] failed to load update manifest:", error);
    const fallback = downloadSource
      .replaceAll("{{version}}", "暂时无法获取")
      .replaceAll("{{releaseUrl}}", RELEASES_PAGE_URL);
    downloadContent.innerHTML = markdown.render(fallback);
  }
};

void loadRelease();
