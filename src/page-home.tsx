import { LocaleLink as Link } from "./locale-link";
import { useLocale } from "./use-locale";
import { usePageMeta } from "./page-meta";
import { useEffect, useRef } from "react";
import { CommunitySection } from "./community-section";
import { useReveal } from "./use-reveal";
import { useTheme } from "./theme";

/**
 * 演示视频只在两个条件同时成立时播：处于当前主题、且在视口里。滚动过程中先暂停解码，停滑 140ms 后再恢复，兼顾演示动画和滚动流畅。
 *
 * 暗色主题下显示的是 GIF，样式表已经把不匹配的那个藏起来了，这里只管别让藏起来的视频在后台空转。
 */
function useHeroVideo(videoRef: React.RefObject<HTMLVideoElement | null>, source: string) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let inView = false;
    let scrollPaused = false;
    let resumeTimer = 0;

    const sync = () => {
      if (!inView || scrollPaused) {
        video.pause();
        return;
      }

      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView = entry.isIntersecting;
          sync();
        }
      },
      { rootMargin: "64px 0px", threshold: 0.05 }
    );

    observer.observe(video);

    const onScroll = () => {
      if (!scrollPaused) {
        scrollPaused = true;
        video.pause();
      }

      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        scrollPaused = false;
        sync();
      }, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(resumeTimer);
    };
  }, [videoRef]);

  /*
   * 换主题就是换一段视频。两个分支都是 <video> 且在同一个位置，React 会复用同一个 DOM 节点、只替换里面的
   * <source> —— 而改 source 不会让媒体元素重新取流，不显式 load() 一次的话，切过去放的还是上一份。
   * 复用节点本身是好事：上面那个 IntersectionObserver 盯的是同一个元素，不必跟着重挂。
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // currentSrc 是解析后的绝对地址，已经在放这一份就不必重新取流
    if (video.currentSrc.endsWith(source)) return;

    video.load();
    void video.play().catch(() => {});
  }, [videoRef, source]);
}

/** 两套主题各一段演示。路径同时喂给 <source> 和播放钩子，避免两处各写一份。 */
const LIGHT_DEMO = "/img/typing_words_light.mp4";
const DARK_DEMO = "/img/typing_words.mp4";

const FEATURES = [
  {
    kicker: "输入方案",
    title: "全拼 · 双拼 · 五笔",
    desc: "双拼支持小鹤、自然码、首道与微软方案，五笔提供 86 版。辅助码可选蓝天小雨点、自然码、首右 2.0、首右 Plus 和小鹤，把同音候选缩小到更容易挑选的范围。",
  },
  {
    kicker: "云候选与 AI",
    title: "本地优先，云端可选",
    desc: "拼音转换和词库查询在本机完成。Windows 和 Linux 默认开启云候选，可在设置中关闭；AI 联想需配置服务。联网内容与默认状态见隐私说明。",
  },
  {
    kicker: "界面与工具",
    title: "候选窗与输入工具",
    desc: "Windows 版提供横排与竖排候选窗、字体与皮肤设置，以及悬浮工具栏、语音输入、手写识别板和屏幕键盘。功能页展示实际界面与使用示例。",
  },
] as const;

const HERO_STATS = [
  { value: "3 套", label: "输入方案", isText: false },
  { value: "5 套", label: "辅助码方案", isText: false },
  { value: "4 个", label: "平台开发方向", isText: false },
  { value: "GPL-3.0", label: "开源许可", isText: true },
] as const;

const PLATFORMS = [
  { name: "Windows 10 / 11", desc: "支持全拼、双拼和五笔", status: "公开测试", isLive: true },
  { name: "macOS 12+", desc: "提供安装包与使用指南", status: "公测", isLive: true },
  { name: "Linux", desc: "适用于使用 IBus 的桌面环境", status: "测试版本", isLive: true },
  { name: "iOS", desc: "通过 TestFlight 安装", status: "公测", isLive: true },
] as const;

export function HomePage() {
  const { t } = useLocale();
  usePageMeta();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLight } = useTheme();

  useHeroVideo(videoRef, isLight ? LIGHT_DEMO : DARK_DEMO);
  useReveal();

  return (
    <main>
      <div className="hero-band">
        <div className="hero-glow" aria-hidden="true" />
        <svg className="hero-mark" viewBox="0 0 100 110" aria-hidden="true">
          <path d="M74.7 14L35.2 29.2L74.7 40.6L35.2 59.5C72.6 65.8 107.7 71 33 95" />
        </svg>

        <div className="container hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-line" />
              <span className="hero-eyebrow-text">MSIME · OPEN SOURCE IME</span>
            </div>

            <h1 className="hero-title">
              {t("水杉输入法，")}<span>{t("让中文输入更顺手")}</span>
            </h1>

            <p className="hero-desc">{t("支持全拼、双拼和五笔，可按习惯调整候选窗、词库与辅助码。Windows、macOS 和 Linux 提供下载，macOS 与 iOS 已开放公测，iOS 通过 TestFlight 安装，各平台功能以对应版本说明为准。")}</p>

            <p className="hero-quote">{t("墨池飞出北溟鱼，笔锋杀尽中山兔。")}</p>

            <div className="hero-buttons btn-row">
              <Link className="btn btn-lg btn-primary" to="/download/">
                {t("下载")}<img src="/img/icons/Download.svg" alt="" className="btn-icon" />
              </Link>
              <Link className="btn btn-lg btn-ghost" to="/docs/$guide/" params={{ guide: "windows" }}>
                {t("阅读文档")}</Link>
            </div>
          </div>

          <div className="hero-stats card-lift">
            {t(HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <div className={`hero-stat-value${stat.isText ? " is-text" : ""}`}>{t(stat.value)}</div>
                <div className="hero-stat-label">{t(stat.label)}</div>
              </div>
            )))}
          </div>

          <div className="hero-demo">
            <div className="hero-screenshot">
              <div className="hero-screenshot-bar">
                <span className="hero-screenshot-dot" />
                <span className="hero-screenshot-dot" />
                <span className="hero-screenshot-dot" />
                <span className="hero-screenshot-title">{t("水杉输入法 · 输入演示")}</span>
              </div>
              {/*
                只渲染当前主题用得上的那一份。样式表本来就把另一份藏起来了，但 display: none 不阻止请求 ——
                两份一起下会白白多取一整段视频，而它一个像素都不会显示。
              */}
              <div className="hero-media-frame">
                {t(isLight ? (
                  <video
                    className="hero-media hero-media-light"
                    ref={videoRef}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/img/typing_words_light_poster.jpg"
                    aria-label={t("输入演示")}
                  >
                    <source src={LIGHT_DEMO} type="video/mp4" />
                  </video>
                ) : (
                  /*
                    暗色这份原来是 GIF，而那张 GIF 把录制时的窗口边框一起录进去了：第 0 行整行是 rgb(224,227,230)，
                    左右两列的首像素同样。浅色下它跟周围一样亮，看不出来；暗色下就是 #2a2a2a 底上的一道白边。
                    仓库里本来就有同一段演示的暗色视频，没有那道边框，还比 GIF 小 141 KB。
                  */
                  <video
                    className="hero-media hero-media-dark"
                    ref={videoRef}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/img/typing_words_poster.jpg"
                    aria-label={t("输入演示")}
                  >
                    <source src={DARK_DEMO} type="video/mp4" />
                    <source src="/img/typing_words.webm" type="video/webm" />
                  </video>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container section">
        <div className="section-eyebrow" data-reveal>
          <span>{t("输入功能")}</span>
          <span className="section-rule" />
        </div>

        <div className="feature-grid" data-reveal-stagger>
          {t(FEATURES.map((feature) => (
            <div className="card card-lift feature-card" data-reveal key={feature.kicker}>
              <div className="feature-kicker">{t(feature.kicker)}</div>
              <div className="feature-title">{t(feature.title)}</div>
              <div className="feature-desc">{t(feature.desc)}</div>
            </div>
          )))}
        </div>
      </section>

      <section className="container section">
        <div className="section-eyebrow" data-reveal>
          <span>{t("开源")}</span>
          <span className="section-rule" />
        </div>

        <div className="card open-card" data-reveal>
          <h2>{t("代码公开，欢迎参与")}</h2>
          <p>{t("输入法会处理输入内容。公开源码和隐私说明，方便你了解本地处理与联网功能的边界，也欢迎你参与检查和改进。使用、修改与分发代码时，请遵循对应仓库的开源许可。")}</p>
          <p>
            {t("欢迎参与代码、词库、文档、翻译和兼容性测试。可以先查看各仓库的 Issue（问题与任务），其中标有")}<code>no-code</code> {t("的任务以非代码工作为主，请以任务说明为准。")}</p>
          <div className="btn-row">
            <a className="btn btn-primary" href="https://github.com/metasequoiaime" target="_blank" rel="noreferrer">
              {t("在 GitHub 上参与")}</a>
            <Link className="btn btn-soft" to="/code/">
              {t("看全部仓库")}</Link>
          </div>
        </div>
      </section>

      <CommunitySection />

      <section className="container section">
        <div className="section-eyebrow" data-reveal>
          <span>{t("平台与下载")}</span>
          <span className="section-rule" />
        </div>

        <h2 className="section-title" data-reveal>
          {t("选择你的平台")}</h2>
        <p className="section-lead" data-reveal>
          {t("各平台共用输入引擎，但界面、功能和发布进度有所不同。请在下载页查看对应版本与安装说明。")}</p>

        <div className="platform-list" data-reveal>
          {t(PLATFORMS.map((platform) => (
            <div className="platform-row" key={platform.name}>
              <span className="platform-name">{t(platform.name)}</span>
              <span className="platform-desc">{t(platform.desc)}</span>
              <span className={`platform-status${platform.isLive ? " is-live" : ""}`}>{t(platform.status)}</span>
            </div>
          )))}
        </div>

        <div className="btn-row platform-cta" data-reveal>
          <Link className="btn btn-primary" to="/download/">
            {t("前往下载页")}<img src="/img/icons/Download.svg" alt="" className="btn-icon" />
          </Link>
          <Link className="btn btn-ghost" to="/code/">
            {t("查看仓库")}</Link>
        </div>
      </section>
    </main>
  );
}
