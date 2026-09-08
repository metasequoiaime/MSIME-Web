import { useLocale } from "./use-locale";
import { useEffect, useRef, useState } from "react";

export type Screenshot = { id: string; url: string; file: File };

export function ScreenshotViewer({ images, selected, onClose }: { images: Screenshot[]; selected: string | null; onClose: () => void }) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [original, setOriginal] = useState(false);
  useEffect(() => {
    if (!selected) return;
    setIndex(Math.max(0, images.findIndex(image => image.id === selected)));
    setOriginal(false);
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [selected, images]);
  const current = images[index];
  const move = (offset: number) => { setIndex(value => (value + offset + images.length) % images.length); setOriginal(false); };
  return <dialog ref={dialog} className="screenshot-viewer" aria-label={t("截图预览")} onCancel={onClose} onClose={onClose} onKeyDown={event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
  }}>
    {current && <>
      <header><div><strong>{current.file.name}</strong><span>{t(index + 1)} / {t(images.length)}</span></div><button type="button" onClick={onClose} aria-label={t("关闭截图预览")}>{t("关闭 ✕")}</button></header>
      <div className={`screenshot-viewer-canvas${original ? " is-original" : ""}`} key={`${current.id}-${original}`}><img src={current.url} alt={t(current.file.name)} /></div>
      <footer><button type="button" disabled={images.length < 2} onClick={() => move(-1)}>{t("← 上一张")}</button><button type="button" aria-pressed={original} onClick={() => setOriginal(value => !value)}>{t(original ? "适应窗口" : "原始尺寸")}</button><button type="button" disabled={images.length < 2} onClick={() => move(1)}>{t("下一张 →")}</button></footer>
    </>}
  </dialog>;
}
