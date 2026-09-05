import downloadSource from "./content/download.md?raw";
import { renderContentPage, setPageKicker } from "./content-page";
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

const render = (version: string, releaseUrl: string) => {
  renderContentPage({
    target: downloadContent,
    source: downloadSource.replaceAll("{{version}}", version).replaceAll("{{releaseUrl}}", releaseUrl),
    sectioned: true,
  });
};

const loadRelease = async () => {
  if (!(downloadContent instanceof HTMLElement)) {
    return;
  }

  try {
    const response = await fetch(`/update.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Update manifest returned ${response.status}`);

    const manifest = await response.json() as UpdateManifest;
    if (!isValidVersion(manifest.version) || !isValidReleaseUrl(manifest.releaseUrl)) {
      throw new Error("Invalid update manifest");
    }

    setPageKicker(`Windows v${manifest.version}`);
    render(manifest.version, manifest.releaseUrl);
  } catch (error) {
    console.warn("[download] failed to load update manifest:", error);
    render("暂时无法获取", RELEASES_PAGE_URL);
  }
};

void loadRelease();
