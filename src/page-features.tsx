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
    title: "浏览器中的候选窗",
    body: "浏览器的搜索框里用双拼加辅助码打出「水杉输入法」。候选窗由输入法自己绘制，不依赖应用配合。",
    alt: "Edge 浏览器的搜索框中显示水杉输入法的候选窗，第一项是「水杉输入法」",
  },
  {
    src: "/img/wt-screenshot-840w.webp",
    srcSet: "/img/wt-screenshot-840w.webp 840w",
    title: "用辅助码区分同音候选",
    body: "终端里输入 fuvuma，候选按辅助码分开：辅助码 iU、辅助 iQ、附注 eD 各自可辨，便于进一步筛选。",
    alt: "Windows Terminal 中的深色候选窗，逐项标注辅助码",
  },
  {
    src: "/screenshots/install-finish-840w.webp",
    srcSet: "/screenshots/install-finish-840w.webp 840w",
    title: "安装后切换使用",
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

/*
 * 候选窗的四种形态，图来自 MSIME-Windows 仓库 docs/images 下官方给的截图。
 *
 * 站上原来只有文字说「支持横排与纵排」「辅助码把同音候选缩小」，这几张是它们真实的样子。
 */
const CANDIDATE_VIEWS = [
  {
    id: "helpcode",
    tab: "辅助码",
    caption: "双拼打 uvujuurufa，候选后括号里是辅助码。同音的水杉 / 水山 / 水疝各自可辨，便于选择。",
    alt: "浏览器搜索框下的竖排候选窗，每个候选后面标着两位辅助码",
  },
  {
    id: "horizontal",
    tab: "横排",
    caption: "同一串输入换成横排候选窗，占的纵向空间更少，适合行内输入。",
    alt: "浏览器搜索框下的横排候选窗，候选项并排列出",
  },
  {
    id: "emoji",
    tab: "emoji",
    caption: "候选里可以直接出 emoji，打词的时候顺手就能选。",
    alt: "候选窗中部分候选项旁边显示 emoji 图标",
  },
  {
    id: "mixed",
    tab: "中英混输",
    caption: "已经上屏的中文后面接着敲拼音，不用先切换模式再切回来。",
    alt: "搜索框里是「水杉shurufa」，候选窗继续给出后半段的中文候选",
  },
] as const;

const BUILT_IN_SKINS = ["Fluent", "微信绿", "石墨 Graphite", "杨柳青 Willow green"] as const;

const HELP_CODES = ["蓝天小雨点", "自然码", "首右 2.0", "首右 Plus", "小鹤"] as const;

const readableSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * 给长路径加上断行机会。
 *
 * 浏览器不在反斜杠处断行，整条路径就是一个不可拆的词：行尾剩下的宽度装不下它时，整行提前折掉，右边空出一大块。在每个分隔符后插一个 `<wbr>`，需要折行时断在分隔符处，而不是断在词中间，也不是把整行顶断。
 */
const breakAtSeparators = (path: string) =>
  path
    .split(/(?<=[\\/])/)
    .flatMap((part, index, all) => (index === 0 ? [part] : [<wbr key={all.slice(0, index).join("")} />, part]));

export function FeaturesPage() {
  const [view, setView] = useState<(typeof CANDIDATE_VIEWS)[number]["id"]>("helpcode");
  const [settingsScheme, setSettingsScheme] = useState<"dark" | "light">("dark");
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
        title="Windows 版功能与界面"
        leadHtml="本页以 Windows 版为例，展示候选窗、设置、皮肤与词库功能。其他平台的可用功能和操作方式，请查看对应使用指南。"
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
                <p className="community-kicker">候选窗</p>
                <h2>四种形态，同一个窗口</h2>
              </div>
              <fieldset className="docs-platforms">
                <legend className="visually-hidden">选择候选窗形态</legend>
                {CANDIDATE_VIEWS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`docs-platform${view === item.id ? " is-active" : ""}`}
                    aria-pressed={view === item.id}
                    onClick={() => setView(item.id)}
                  >
                    {item.tab}
                  </button>
                ))}
              </fieldset>
            </div>

            {CANDIDATE_VIEWS.filter((item) => item.id === view).map((item) => (
              <figure className="feature-figure" key={item.id}>
                <img
                  src={`/screenshots/candidate-${item.id}-840w.webp`}
                  srcSet={`/screenshots/candidate-${item.id}-840w.webp 840w, /screenshots/candidate-${item.id}-1680w.webp 1680w`}
                  sizes="(max-width: 900px) 92vw, min(1170px, 86vw)"
                  alt={item.alt}
                  width="840"
                  height="348"
                  decoding="async"
                />
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))}
          </section>

          <section className="card feature-block" data-reveal>
            <div className="feature-block-head">
              <div>
                <p className="community-kicker">设置</p>
                <h2>集中调整常用设置</h2>
                <p className="feature-block-lead">
                  外观、输入、辅助码、快捷键、词库、皮肤、语音输入、屏幕键盘、手写识别板、悬浮工具栏、AI 辅助各占一栏，界面自身也分明暗两套。
                </p>
              </div>
              <fieldset className="docs-platforms">
                <legend className="visually-hidden">设置界面配色</legend>
                {(["dark", "light"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`docs-platform${settingsScheme === value ? " is-active" : ""}`}
                    aria-pressed={settingsScheme === value}
                    onClick={() => setSettingsScheme(value)}
                  >
                    {value === "dark" ? "深色" : "浅色"}
                  </button>
                ))}
              </fieldset>
            </div>

            <figure className="feature-figure is-tall">
              <img
                src={`/screenshots/settings-${settingsScheme}-840w.webp`}
                srcSet={`/screenshots/settings-${settingsScheme}-840w.webp 840w, /screenshots/settings-${settingsScheme}-1680w.webp 1680w`}
                sizes="(max-width: 900px) 92vw, 760px"
                alt={`水杉输入法设置窗口的${settingsScheme === "dark" ? "深色" : "浅色"}界面，左侧列出各个设置分区`}
                width="840"
                height="666"
                decoding="async"
              />
            </figure>
          </section>

          <section className="card feature-block" data-reveal>
            <div className="feature-block-head">
              <div>
                <p className="community-kicker">皮肤</p>
                <h2>自定义候选窗皮肤</h2>
                <p className="feature-block-lead">
                  内置 {BUILT_IN_SKINS.join(" / ")} 四套。外部皮肤把含 <code>skin.toml</code> 的文件夹放进{" "}
                  <code>{breakAtSeparators("%LOCALAPPDATA%\\metasequoiaime\\skins")}</code> 再点「刷新皮肤」即可。
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
                  这里列出公共词库的发布文件；各平台实际随包版本以发布说明为准。词库发布于 {dictionary.publishedAt.slice(0, 10)}，每个文件都附 SHA256。
                </p>
                <ul className="feature-dict">
                  {dictionary.files.map((file: Dictionary["files"][number]) => (
                    <li key={file.name}>
                      <span className="feature-dict-label">{file.label}</span>
                      {/* 外面这层负责铺整行底色，里面的 code 才是那个小色块 */}
                      <span className="feature-dict-file">
                        <code>{file.name}</code>
                      </span>
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
              候选项后面括号里的两个字母就是辅助码。打完拼音再补一到两码，可以缩小同音候选范围，减少翻页。可选方案：
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
