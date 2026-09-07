import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { fetchPlatforms, type Dictionary } from "./platforms-data";
import { useReveal } from "./use-reveal";

/*
 * 真实截图，不做示意图。
 *
 * 能力区原本只有文字，讲皮肤、悬浮工具栏、语音输入、手写板、屏幕键盘却一张图都没有 —— 输入法是看着用的东西，光靠描述说不清。这里放的都是仓库里已有的真实画面；没有截图的功能宁可先不放，也不摆一张示意图冒充。
 */
const SHOTS = [
  {
    src: "/img/edge-screenshot-840w.webp",
    srcSet: "/img/edge-screenshot-840w.webp 840w, /img/edge-screenshot-1680w.webp 1680w",
    title: "任何应用里都是同一套候选窗",
    body: "浏览器的搜索框里用双拼加辅助码打出「水杉输入法」。候选窗由输入法自己绘制，不依赖应用配合。",
    alt: "Edge 浏览器的搜索框中显示水杉输入法的候选窗，第一项是「水杉输入法」",
  },
  {
    src: "/img/wt-screenshot-840w.webp",
    srcSet: "/img/wt-screenshot-840w.webp 840w",
    title: "辅助码把同音字缩到一屏",
    body: "终端里输入 fuvuma，候选按辅助码分开：辅助码 iU、辅助 iQ、附注 eD 各自可辨，不必翻页找字。",
    alt: "Windows Terminal 中的深色候选窗，逐项标注辅助码",
  },
  {
    src: "/screenshots/install-finish-840w.webp",
    srcSet: "/screenshots/install-finish-840w.webp 840w",
    title: "装完即用",
    body: "安装程序结束后按提示切换输入法即可，不需要注册、不需要登录。",
    alt: "水杉输入法安装程序的完成页，勾选着启动 Server 与 Watchdog 两项",
  },
] as const;

/*
 * 皮肤预览。
 *
 * 这是按 skin.toml 里公布的配色现场画出来的候选窗，不是截图 —— 皮肤示例仓库那张角色图，项目自己在 skin.toml 的 license 段标了 UNVERIFIED-DEMO-ONLY，不该出现在官网上，所以这里只用配色，不用它的素材。
 */
const SKIN_SAMPLE = {
  dark: { surface: "#202020", border: "rgba(155, 155, 155, 0.18)", text: "#e9e8e8", muted: "#e9e8e89d", accent: "#e08aa8", selected: "rgba(224, 138, 168, 0.28)" },
  light: { surface: "#fff7fa", border: "rgba(176, 80, 110, 0.22)", text: "#2b2b2b", muted: "#2b2b2b9d", accent: "#c45c7a", selected: "rgba(196, 92, 122, 0.18)" },
} as const;

const CANDIDATES = [
  ["1", "你们", "rR"],
  ["2", "你", "rX"],
  ["3", "尼", "uV"],
  ["4", "妮", "nV"],
] as const;

function CandidatePreview({ scheme, layout }: { scheme: "dark" | "light"; layout: "vertical" | "horizontal" }) {
  const c = SKIN_SAMPLE[scheme];
  return (
    <div
      className={`skin-window is-${layout}`}
      style={{ background: c.surface, borderColor: c.border, color: c.text }}
      aria-hidden="true"
    >
      <div className="skin-pinyin" style={{ color: c.muted }}>
        ni&apos;mf
        <span className="skin-caret" style={{ background: c.accent }} />
      </div>
      <div className="skin-rows">
        {CANDIDATES.map(([index, word, code], position) => (
          <span
            key={word}
            className="skin-cand"
            style={position === 0 ? { background: c.selected } : undefined}
          >
            <span className="skin-num" style={{ color: c.muted }}>
              {index}
            </span>
            {word}
            <span className="skin-code" style={{ color: c.muted }}>
              ({code})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const BUILT_IN_SKINS = ["Fluent", "微信绿", "石墨 Graphite", "杨柳青 Willow green"] as const;

const HELP_CODES = ["蓝天小雨点", "自然码", "首右 2.0", "首右 Plus", "小鹤"] as const;

const readableSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function FeaturesPage() {
  const [scheme, setScheme] = useState<"dark" | "light">("dark");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const platforms = useQuery({ queryKey: ["platforms"], queryFn: fetchPlatforms, staleTime: Number.POSITIVE_INFINITY, retry: 1 });
  const dictionary = platforms.data?.dictionary ?? null;

  usePageMeta("功能 | 水杉输入法", "水杉输入法的候选窗、皮肤与词库：实际画面、可自定义的部分，以及随版本分发的词库。");
  useReveal([dictionary]);

  return (
    <>
      <PageHero
        kicker="功能"
        title="它用起来是什么样"
        leadHtml="候选窗由输入法自己绘制，在浏览器、终端、办公软件里是同一套。外观可以整套替换，词库和辅助码方案可以自己扩。"
      />

      <main className="content-page">
        <div className="container">
          <section className="feature-shots" data-reveal-stagger>
            {SHOTS.map((shot) => (
              <figure className="card feature-shot" data-reveal key={shot.src}>
                {/* 卡片里最多显示 ~420px 宽，原图有 1735px。sizes 让浏览器按实际显示宽度挑，别下大的那张。 */}
                <img
                  src={shot.src}
                  srcSet={shot.srcSet}
                  sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 400px"
                  alt={shot.alt}
                  width="840"
                  height="525"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <strong>{shot.title}</strong>
                  <span>{shot.body}</span>
                </figcaption>
              </figure>
            ))}
          </section>

          <section className="card feature-block" data-reveal>
            <div className="feature-block-head">
              <div>
                <p className="community-kicker">皮肤</p>
                <h2>候选窗可以整套换掉</h2>
                <p className="feature-block-lead">
                  内置 {BUILT_IN_SKINS.join(" / ")} 四套。外部皮肤把含 <code>skin.toml</code> 的文件夹放进{" "}
                  <code>%LOCALAPPDATA%\metasequoiaime\skins</code> 再点「刷新皮肤」即可。
                </p>
              </div>

              <div className="feature-toggles">
                <fieldset className="docs-platforms">
                  <legend className="visually-hidden">预览配色</legend>
                  {(["dark", "light"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`docs-platform${scheme === value ? " is-active" : ""}`}
                      aria-pressed={scheme === value}
                      onClick={() => setScheme(value)}
                    >
                      {value === "dark" ? "深色" : "浅色"}
                    </button>
                  ))}
                </fieldset>
                <fieldset className="docs-platforms">
                  <legend className="visually-hidden">预览排布</legend>
                  {(["vertical", "horizontal"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`docs-platform${layout === value ? " is-active" : ""}`}
                      aria-pressed={layout === value}
                      onClick={() => setLayout(value)}
                    >
                      {value === "vertical" ? "竖排" : "横排"}
                    </button>
                  ))}
                </fieldset>
              </div>
            </div>

            <div className="skin-stage">
              <CandidatePreview scheme={scheme} layout={layout} />
              <p className="skin-note">
                按皮肤示例仓库 <code>skin.toml</code> 公布的配色现场绘制，用于说明可自定义的范围，不是应用截图。一套皮肤可以声明强调色、选中态、悬停态、边框与背景，并分别给深浅两种配色，还能指定横排 / 竖排支持与候选窗装饰。
              </p>
            </div>

            <div className="btn-row">
              <a className="btn btn-soft" href="https://github.com/metasequoiaime/metasequoia-ime-skin-example" target="_blank" rel="noreferrer">
                皮肤示例与编写说明
              </a>
            </div>
          </section>

          <section className="card feature-block" data-reveal>
            <p className="community-kicker">词库</p>
            <h2>三类词库，都可以自己导入</h2>
            <p className="feature-block-lead">
              设置里可以切换全拼、五笔和英文词库，查询、新增、改权重都在同一个界面。批量导入用制表符分隔的三列纯文本。
            </p>

            <div className="feature-formats">
              <div>
                <span className="feature-format-label">全拼</span>
                <pre>
                  <code>你好{"\t"}ni&apos;hao{"\t"}10</code>
                </pre>
              </div>
              <div>
                <span className="feature-format-label">五笔</span>
                <pre>
                  <code>你好{"\t"}wbgq{"\t"}10</code>
                </pre>
              </div>
            </div>

            {dictionary && (
              <>
                <h3 className="feature-sub">随版本分发的词库 · {dictionary.tag}</h3>
                <p className="feature-block-lead">
                  三个平台装的是同一份词库，发布于 {dictionary.publishedAt.slice(0, 10)}，每个文件都附 SHA256。
                </p>
                <ul className="feature-dict">
                  {dictionary.files.map((file: Dictionary["files"][number]) => (
                    <li key={file.name}>
                      <span className="feature-dict-label">{file.label}</span>
                      <code>{file.name}</code>
                      <span className="feature-dict-size">{readableSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
                <div className="btn-row">
                  <a className="btn btn-soft" href={dictionary.releaseUrl} target="_blank" rel="noreferrer">
                    词库发布页
                  </a>
                </div>
              </>
            )}
          </section>

          <section className="card feature-block" data-reveal>
            <p className="community-kicker">辅助码</p>
            <h2>五套方案，把同音候选分开</h2>
            <p className="feature-block-lead">
              候选项后面括号里的两个字母就是辅助码。打完拼音再补一到两码，同音字一次就能选中，不必翻页。可选方案：
            </p>
            <ul className="feature-chips">
              {HELP_CODES.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
