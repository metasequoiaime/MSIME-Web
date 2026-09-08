import { usePageSearch } from "./use-page-search";
import { useLocale } from "./use-locale";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { z } from "zod";
import downloadSource from "./content/download.md?raw";
import { ContentPage } from "./page-content";
import { detectPlatform, PLATFORM_LABELS, PLATFORMS, type Platform } from "./platform";
import { fetchPlatforms, type PlatformRelease } from "./platforms-data";

const RELEASES_PAGE_URL = "https://github.com/metasequoiaime/MSIME-Windows/releases";

// The name is substituted into a fenced command the reader is meant to paste. Restricting it to the shape the release workflow actually produces keeps a manifest value from carrying its own fence or shell metacharacters into that block.
const installerNameSchema = z
  .string()
  .regex(/^MetasequoiaIME_Setup_v[\w.-]+\.exe$/i)
  .optional()
  .catch(undefined);

/**
 * 版本号和 Release 地址读不出来就整份作废，回落到「暂时无法获取」；其余字段坏了只是它自己缺席，不该拖垮整页。
 *
 * Release 地址必须落在本项目的 releases 路径下：这个值会直接变成页面上的下载链接。
 */
const updateManifestSchema = z.object({
  version: z.string().regex(/^\d+(?:\.\d+)*$/),
  releaseUrl: z.string().refine((value) => value === RELEASES_PAGE_URL || value.startsWith(`${RELEASES_PAGE_URL}/`)),
  // 直接指向安装包的地址，按钮点下去就开始下。它比 releaseUrl 更需要限死前缀：这是唯一一个用户不看地址栏就会执行的文件。
  installerUrl: z
    .string()
    .refine((value) => value.startsWith(`${RELEASES_PAGE_URL}/download/`))
    .optional()
    .catch(undefined),
  installerName: installerNameSchema,
  installerSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional()
    .catch(undefined),
  signed: z.boolean().optional().catch(undefined),
});

type UpdateManifest = z.infer<typeof updateManifestSchema>;

const FALLBACK_INSTALLER_NAME = "MetasequoiaIME_Setup_v<版本>.exe";

// The page must never claim the installer is signed when it is not. The manifest reports what the published asset actually is, so the security note is derived from that rather than written by hand -- an earlier hard-coded note told users to refuse anything without a signature while the only downloadable build was unsigned, which trains people to ignore signature warnings.
const securityNote = (manifest: Partial<UpdateManifest>): string => {
  const lines: string[] = [];

  if (manifest.signed === true) {
    lines.push("Windows 安装包带有数字签名。安装前请在文件属性的「数字签名」标签页确认签名；签名缺失，请勿安装。");
  } else if (manifest.signed === false) {
    lines.push(
      "**当前 Windows 构建未经代码签名**（文件名带 `unsigned`）。Windows 可能显示安全警告；请先核对发布来源和校验值。此类构建无法使用 uiAccess，可能影响管理员权限程序中的候选窗显示。"
    );
    lines.push("");
    lines.push("可用以下 SHA256 校验下载文件是否与发布文件一致；校验值不能替代代码签名：");
  } else {
    // The manifest could not be read, or predates the field. Saying "unsigned" here would be a claim about a release the page failed to look up -- and the sentence about checking SHA256 instead has nothing to follow it, because the digest comes from the same manifest.
    lines.push("无法读取发布信息，请到 Releases 页面确认该版本是否带有数字签名，并核对页面上给出的 SHA256。");
  }

  if (manifest.installerSha256) {
    const name = manifest.installerName ?? FALLBACK_INSTALLER_NAME;
    lines.push("");
    lines.push("```powershell");
    lines.push(`Get-FileHash .\\${name} -Algorithm SHA256`);
    lines.push("```");
    lines.push("");
    lines.push(`应得到：\`${manifest.installerSha256}\``);
    lines.push("");
    lines.push("请将计算结果与这里的官方校验值逐字核对。从备用镜像下载时也应核对。");
  }

  return lines.join("\n");
};

/*
 * macOS 与 Linux 的签名说明。
 *
 * 这两段原本是手写在 markdown 里的定论（「未经 Apple 公证」「Linux 包同样未经签名」）。手写的问题在于：签名状态会变，正文不会跟着变，将来签上了这页就在说假话。改成按产物推 —— 和 Windows 那段用的是同一条原则：页面绝不能声称一个没签名的包签过名，也不该在判不出来时替它下结论。
 */
const PLATFORM_SIGNING: Record<"macos" | "linux", Record<"signed" | "unsigned" | "unknown", string>> = {
  macos: {
    // 文件名去掉 `unsigned` 只说明它没被标成未签名，不代表过了 Apple 公证 —— 公证与否决定首次打开会不会被 Gatekeeper 拦，
    // 这是文件名承载不了的信息。写「不会被拦截」是拿一个约定去担保另一件事，用户真被拦了就是页面在撒谎。
    signed:
      "发布清单将当前构建标记为已签名；Apple 公证状态请以发布说明为准。首次打开如遇系统提示，请先核对来源、校验值和该版本的安装说明。每个版本仍附带 `.sha256` 校验文件，可用 `shasum -a 256` 核对下载完整性。",
    unsigned:
      "当前构建标记为**未签名**。签名与 Apple 公证是不同的验证步骤，公证状态请以发布说明为准。首次打开可能出现系统警告，请先核对来源与安装说明。每个版本都附带 `.sha256` 校验文件，可用 `shasum -a 256` 核对下载完整性。",
    unknown:
      "公证状态请以发布页说明为准。每个版本都附带 `.sha256` 校验文件，可用 `shasum -a 256` 核对下载完整性。",
  },
  linux: {
    signed:
      "当前包带有签名。Release 页面每个资产旁都显示 GitHub 计算的 SHA256，下载后可用 `sha256sum <文件名>` 核对。",
    unsigned:
      "当前包未经签名。Release 页面每个资产旁都显示 GitHub 计算的 SHA256，下载后可用 `sha256sum <文件名>` 核对。",
    unknown:
      "Linux 包的文件名不体现签名状态，请以发布页说明为准。Release 页面每个资产旁都显示 GitHub 计算的 SHA256，下载后可用 `sha256sum <文件名>` 核对。",
  },
};

const signingKey = (signed: boolean | null | undefined) =>
  signed === true ? "signed" : signed === false ? "unsigned" : "unknown";

const fillTemplate = (
  version: string,
  releaseUrl: string,
  manifest: Partial<UpdateManifest>,
  platforms: Partial<Record<Platform, PlatformRelease>> | undefined
) => {
  const other = (platform: "macos" | "linux", fallbackUrl: string) => {
    const release = platforms?.[platform];
    return {
      version: release?.version ?? "暂时无法获取",
      releaseUrl: release?.releaseUrl ?? fallbackUrl,
      signing: PLATFORM_SIGNING[platform][signingKey(release?.signed)],
      packages: describePackages(release?.downloads),
    };
  };

  const macos = other("macos", RELEASE_PAGES.macos);
  const linux = other("linux", RELEASE_PAGES.linux);

  return downloadSource
    .replaceAll("{{version}}", version)
    .replaceAll("{{releaseUrl}}", releaseUrl)
    .replaceAll("{{securityNote}}", securityNote(manifest))
    .replaceAll("{{installerName}}", manifest.installerName ?? FALLBACK_INSTALLER_NAME)
    .replaceAll("{{macosVersion}}", macos.version)
    .replaceAll("{{macosReleaseUrl}}", macos.releaseUrl)
    .replaceAll("{{macosSigning}}", macos.signing)
    .replaceAll("{{macosPackages}}", macos.packages)
    .replaceAll("{{linuxVersion}}", linux.version)
    .replaceAll("{{linuxReleaseUrl}}", linux.releaseUrl)
    .replaceAll("{{linuxSigning}}", linux.signing)
    .replaceAll("{{linuxPackages}}", linux.packages);
};

// 取不到 platforms.json 时的发布页兜底；iOS 直接通过 TestFlight 安装。
const RELEASE_PAGES: Record<Exclude<Platform, "ios">, string> = {
  windows: RELEASES_PAGE_URL,
  macos: "https://github.com/metasequoiaime/MSIME-Apple/releases",
  linux: "https://github.com/metasequoiaime/MSIME-Linux/releases",
};

const TESTFLIGHT_LINK = "https://testflight.apple.com/join/bUzPvyqt";

const readableSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/*
 * 「有哪些包、支持哪些架构」这类事实，从产物里数出来，不写在文案里。
 *
 * 之前正文和面板都是手写清单（「提供 .deb、.rpm 和 .tar.gz 三种包」「支持 x86_64 与 aarch64」）。发布流水线哪天多出一种包或砍掉一种架构，这些句子不会跟着变，页面就开始说谎 —— 和手写签名结论是同一类毛病。
 */
const FORMAT_OF = (name: string) => {
  const match = /\.(deb|rpm|pkg|zip|exe|tar\.gz)$/i.exec(name);
  return match ? match[1].toLowerCase() : null;
};

/* 中英混排里，连接词两侧要留空格，否则「pkg与zip」会连成一团 */
const joinCn = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join("、")} 与 ${items[items.length - 1]}`;

const COUNT_CN = ["", "一", "两", "三", "四", "五", "六", "七", "八"];

export const describePackages = (downloads: PlatformRelease["downloads"] | undefined) => {
  if (!downloads?.length) return "安装包清单暂时无法获取";

  const formats = [...new Set(downloads.map((entry) => FORMAT_OF(entry.name)).filter((f): f is string => f !== null))];
  const arches = [...new Set(downloads.map((entry) => entry.arch))];

  // 清单是穷举的，不写「等」
  const formatPart = formats.length
    ? formats.length === 1
      ? `提供 ${formats[0]} 包`
      : `提供 ${joinCn(formats)} ${COUNT_CN[formats.length] ?? formats.length}种包`
    : "";

  // macOS 只有一个 Universal 标注，说「覆盖 Universal」不像话
  const archPart =
    arches.length === 1 && arches[0] === "Universal" ? "为 Universal 构建" : arches.length ? `覆盖 ${joinCn(arches)}` : "";

  return [formatPart, archPart].filter(Boolean).join("，");
};

// 系统要求是产品决策，不在产物里，只能写下来
const PLATFORM_HINTS: Record<Platform, string> = {
  windows: "适用于 Windows 10 与 Windows 11",
  macos: "适用于 macOS 12 及以上",
  ios: "适用于 iOS 15 及以上，通过 TestFlight 安装",
  linux: "IBus 前端",
};

/**
 * 按架构把下载分组。
 *
 * 这批文件是「架构 × 格式」的矩阵：Linux 三种格式各出 x86_64 和 aarch64 两份。平铺成一列的话每行都要贴一个架构标签，同一个词重复五遍；按架构分组之后那个词只出现一次，而且对得上人挑包的顺序 —— 先确定自己是什么机器，再选发行版对应的格式。顺序沿用清单里的先后，不另外排。
 */
const groupByArch = (downloads: PlatformRelease["downloads"]) => {
  const groups = new Map<string, PlatformRelease["downloads"]>();

  for (const entry of downloads) {
    const existing = groups.get(entry.arch);
    if (existing) existing.push(entry);
    else groups.set(entry.arch, [entry]);
  }

  return [...groups];
};

/**
 * 页面顶部的下载入口。
 *
 * 在这之前，这一页最主要的操作是正文项目符号里的一个文字链接，和旁边的镜像链接、说明文字一样重 —— 来下载的人得先读一段才找得到它。这里把它提到页头之下，并且让人自己选平台：按 UA 猜到的那个只是默认选中，三个入口一直都在。
 */
function DownloadPanel({ platforms }: { platforms: Partial<Record<Platform, PlatformRelease>> | undefined }) {
  const { t } = useLocale();
  const { choice, update, get, ready } = usePageSearch();
  const requestedPlatform = get("platform");
  const platform = choice("platform", PLATFORMS, "windows");
  const setPlatform = (value: Platform) => update({ platform: value });
  // Explicit links take precedence over device detection, including on back/forward.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only normalize when the URL platform changes.
  useLayoutEffect(() => {
    if (ready && !PLATFORMS.includes(requestedPlatform as Platform)) update({ platform: detectPlatform() }, true);
  }, [requestedPlatform, ready]);
  const current = platforms?.[platform];
  const primary = current?.downloads[0];

  return (
    <div className="download-panel">
      <nav className="download-panel-tabs" aria-label={t("选择平台")}>
        {t(PLATFORMS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={`docs-platform${candidate === platform ? " is-active" : ""}`}
            aria-current={candidate === platform ? "true" : "false"}
            onClick={() => {
              setPlatform(candidate);
            }}
          >
            {t(PLATFORM_LABELS[candidate])}
          </button>
        )))}
      </nav>

      <div className="download-panel-action">
        {platform === "ios" ? (
          <a className="btn btn-lg btn-primary" href={TESTFLIGHT_LINK} target="_blank" rel="noreferrer">
            {t("通过 TestFlight 安装 iOS 版")}
          </a>
        ) : (
          <a className="btn btn-lg btn-primary" href={primary?.url ?? RELEASE_PAGES[platform]} rel="noreferrer">
            {t(primary
              ? `下载 ${PLATFORM_LABELS[platform]} 版 v${current?.version}`
              : `前往 ${PLATFORM_LABELS[platform]} 发布页`)}
            {primary && <img src="/img/icons/Download.svg" alt="" className="btn-icon" />}
          </a>
        )}

        <div className="download-panel-meta">
          <p>{t(PLATFORM_HINTS[platform])}</p>
          {t(primary && (
            <p className="download-panel-file">
              <code>{primary.name}</code>
              <span className="download-panel-arch">{t(primary.arch)}</span>
              <span>{t(readableSize(primary.size))}</span>
              {/* signed 是三态：判不出来时（比如 Linux 的文件名不带签名信息）什么都不显示，而不是猜一个 */}
              {t(current?.signed === true && <span className="download-panel-signed">{t("已签名")}</span>)}
              {t(current?.signed === false && <span className="download-panel-unsigned">{t("未签名")}</span>)}
            </p>
          ))}
        </div>
      </div>

      {t(current && current.downloads.length > 1 && (
        <div className="download-panel-more">
          <span className="download-panel-more-label">{t("全部下载")}</span>
          <div className="download-panel-arches">
            {t(groupByArch(current.downloads).map(([arch, entries]) => (
              <section key={arch}>
                <h3>{t(arch)}</h3>
                <ul>
                  {t(entries.map((entry) => (
                    <li key={entry.url}>
                      <a href={entry.url} rel="noreferrer">
                        {t(entry.label)}
                      </a>
                      <span className="download-panel-size">{t(readableSize(entry.size))}</span>
                    </li>
                  )))}
                </ul>
              </section>
            )))}
          </div>
        </div>
      ))}

      <p className="download-panel-note">
        {t(platform === "ios" ? (
          // 没有版本号也没有校验值可说：iOS 装的是 TestFlight 当前放出的那个构建，版本由 Apple 那边决定。
          <>{t("不需要邮箱，也不需要开发者账号。上架计划与常见问题见下方 iOS 小节。")}</>
        ) : current ? (
          <>
            {t(current.prerelease ? "公开测试版本，" : "")}{t("发布于")}{t(current.publishedAt.slice(0, 10))}{t("。校验值与安装步骤见下方")}{t(" ")}
            {t(PLATFORM_LABELS[platform])} {t("小节。")}</>
        ) : (
          <>{t("安装步骤、校验值与常见问题见下方")}{t(PLATFORM_LABELS[platform])} {t("小节。")}</>
        ))}
      </p>
    </div>
  );
}

const fetchUpdateManifest = async (): Promise<UpdateManifest> => {
  const response = await fetch(`/update.json?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Update manifest returned ${response.status}`);

  return updateManifestSchema.parse(await response.json());
};

export function DownloadPage() {
  // 页面自己的三平台清单。update.json 另有其主（Windows 客户端的「检查更新」），两者互不干扰。
  const platforms = useQuery({
    queryKey: ["platforms"],
    queryFn: fetchPlatforms,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  const manifest = useQuery({
    queryKey: ["update-manifest"],
    queryFn: fetchUpdateManifest,
    // 清单只在发新版时变，一次会话取一遍就够；`no-store` 加时间戳是为了绕开 CDN 和浏览器缓存，别让它拿到上一版。
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  useEffect(() => {
    if (manifest.error) console.warn("[download] failed to load update manifest:", manifest.error);
  }, [manifest.error]);

  const source = useMemo(() => {
    // 两份清单都在路上时先不渲染正文，免得先写一版「暂时无法获取」再改口
    if (manifest.isPending || platforms.isPending) return null;
    const table = platforms.data?.platforms;
    if (!manifest.data) return fillTemplate("暂时无法获取", RELEASES_PAGE_URL, {}, table);
    return fillTemplate(manifest.data.version, manifest.data.releaseUrl, manifest.data, table);
  }, [manifest.isPending, manifest.data, platforms.isPending, platforms.data]);

  return (
    <ContentPage
      documentTitle="下载 | 水杉输入法"
      description="下载水杉输入法"
      kicker={manifest.data ? `Windows v${manifest.data.version}` : "下载"}
      source={source}
      // 页头取未代入版本号的模板：正文会随清单重渲染，标题和摘要不该跟着闪一下
      heroSource={downloadSource}
      contentId="download-content"
      contentClass="download-content"
      sectioned
      banner={<DownloadPanel platforms={platforms.data?.platforms} />}
    />
  );
}
