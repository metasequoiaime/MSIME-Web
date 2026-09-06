import downloadSource from "./content/download.md?raw";
import { renderContentPage, setPageKicker } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

const RELEASES_PAGE_URL = "https://github.com/metasequoiaime/MSIME-Windows/releases";

type UpdateManifest = {
  version?: unknown;
  releaseUrl?: unknown;
  installerName?: unknown;
  installerSha256?: unknown;
  signed?: unknown;
};

const downloadContent = document.getElementById("download-content");

const isValidVersion = (value: unknown): value is string =>
  typeof value === "string" && /^\d+(?:\.\d+)*$/.test(value);

const isValidReleaseUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (value === RELEASES_PAGE_URL || value.startsWith(`${RELEASES_PAGE_URL}/`));

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

// The name is substituted into a fenced command the reader is meant to paste. Restricting it to the
// shape the release workflow actually produces keeps a manifest value from carrying its own fence or
// shell metacharacters into that block.
const isInstallerName = (value: unknown): value is string =>
  typeof value === "string" && /^MetasequoiaIME_Setup_v[\w.-]+\.exe$/i.test(value);

const FALLBACK_INSTALLER_NAME = "MetasequoiaIME_Setup_v<版本>.exe";

// The page must never claim the installer is signed when it is not. The manifest reports what the
// published asset actually is, so the security note is derived from that rather than written by hand
// -- an earlier hard-coded note told users to refuse anything without a signature while the only
// downloadable build was unsigned, which trains people to ignore signature warnings.
const securityNote = (manifest: UpdateManifest): string => {
  const lines: string[] = [];
  if (manifest.signed === true) {
    lines.push("Windows 安装包带有数字签名。安装前请在文件属性的「数字签名」标签页确认签名；签名缺失，请勿安装。");
  } else if (manifest.signed === false) {
    lines.push("**当前 Windows 构建未经代码签名**（文件名带 `unsigned`）。SmartScreen 会拦截，需要手动放行，且输入法的 uiAccess 会失效——候选窗无法浮在以管理员身份运行的程序之上。");
    lines.push("");
    lines.push("在签名恢复之前，请改用 SHA256 校验下载的完整性：");
  } else {
    // The manifest could not be read, or predates the field. Saying "unsigned" here would be a
    // claim about a release the page failed to look up -- and the sentence about checking SHA256
    // instead has nothing to follow it, because the digest comes from the same manifest.
    lines.push("无法读取发布信息，请到 Releases 页面确认该版本是否带有数字签名，并核对页面上给出的 SHA256。");
  }
  if (isSha256(manifest.installerSha256)) {
    const name = isInstallerName(manifest.installerName) ? manifest.installerName : FALLBACK_INSTALLER_NAME;
    lines.push("");
    lines.push("```powershell");
    lines.push(`Get-FileHash .\\${name} -Algorithm SHA256`);
    lines.push("```");
    lines.push("");
    lines.push(`应得到：\`${manifest.installerSha256}\``);
    lines.push("");
    lines.push("这个值由 GitHub 对已存储的文件计算，不是发布说明里手写的，所以走网盘等镜像下载时同样可以用它核对。");
  }
  return lines.join("\n");
};

const render = (version: string, releaseUrl: string, manifest: UpdateManifest = {}) => {
  renderContentPage({
    target: downloadContent,
    source: downloadSource
      .replaceAll("{{version}}", version)
      .replaceAll("{{releaseUrl}}", releaseUrl)
      .replaceAll("{{securityNote}}", securityNote(manifest))
      .replaceAll(
        "{{installerName}}",
        isInstallerName(manifest.installerName) ? manifest.installerName : FALLBACK_INSTALLER_NAME
      ),
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
    render(manifest.version, manifest.releaseUrl, manifest);
  } catch (error) {
    console.warn("[download] failed to load update manifest:", error);
    render("暂时无法获取", RELEASES_PAGE_URL);
  }
};

void loadRelease();
