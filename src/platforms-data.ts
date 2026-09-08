import { z } from "zod";
import { DESKTOP_PLATFORMS, type DesktopPlatform } from "./platform.ts";

const PROJECT_RELEASES = "https://github.com/metasequoiaime/";

/**
 * 地址必须落在本项目的 GitHub 组织下。
 *
 * `z.string().url()` 只判断 `new URL()` 解不解析得了，`javascript:` 和 `data:` 都算合法。这些地址会直接变成下载按钮和列表项的 href —— 用户点下去时不会看地址栏。update.json 那边早就把安装包地址钉死了前缀，platforms.json 喂的是同一个按钮外加另外六个链接，没有理由宽松。
 *
 * 有一个地址不合规就整份作废：这份文件由自动化任务生成、机器人合并，出现组织外的地址意味着链路本身出了问题，此时整块回落到发布页，比展示一份被悄悄过滤过、看起来仍然权威的清单安全。
 */
const projectUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith(PROJECT_RELEASES), { message: "地址必须指向本项目的 GitHub 仓库" });

const downloadSchema = z.object({
  label: z.string(),
  // version 和 arch 会被塞进 markdown 源文再渲染（`当前最新版本：**v{{macosVersion}}**，{{macosPackages}}`）。
  // markdown-it 拦得住 `javascript:`，但外链和图片照渲染 —— 不加约束的话，一个被污染的字段能往正文里塞跟踪像素或误导链接。
  // 收成生成器实际产出的形状：架构是 x86_64 / aarch64 / x64 / Universal 这类裸标识符。
  arch: z.string().regex(/^[A-Za-z0-9_+-]{1,24}$/),
  name: z.string(),
  url: projectUrl,
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().catch(null),
});

/** 由 scripts/generate-platforms.mjs 生成，三个平台各自最新一个已发布版本。 */
const platformsSchema = z.object({
  generatedAt: z.string(),
  platforms: z.record(
    z.enum(DESKTOP_PLATFORMS),
    z.object({
      version: z.string().regex(/^\d+(?:\.\d+)*$/),
      releaseUrl: projectUrl,
      publishedAt: z.string(),
      prerelease: z.boolean().catch(false),
      // 三态：true 已签名、false 未签名、null 判不出来。判不出来时页面什么都不说。
      signed: z.boolean().nullable().catch(null),
      downloads: z.array(downloadSchema).min(1),
    })
  ),
  /* 三个平台共用同一份词库，单独发布，所以放在 platforms 之外。 */
  dictionary: z
    .object({
      tag: z.string(),
      releaseUrl: projectUrl,
      publishedAt: z.string(),
      files: z
        .array(
          z.object({
            name: z.string(),
            label: z.string(),
            size: z.number().int().nonnegative(),
            sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().catch(null),
          })
        )
        .min(1),
    })
    .nullable()
    .catch(null),
});

export const fetchPlatforms = async () => {
  const response = await fetch("/platforms.json");
  if (!response.ok) throw new Error(`Platform manifest returned ${response.status}`);
  return platformsSchema.parse(await response.json());
};


export type Platforms = z.infer<typeof platformsSchema>["platforms"];
export type PlatformRelease = NonNullable<Platforms[DesktopPlatform]>;
export type Dictionary = NonNullable<z.infer<typeof platformsSchema>["dictionary"]>;
