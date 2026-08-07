import { useEffect, useState } from "react";

/**
 * 页面滚动进度（0–100 的整数）。
 *
 * 用 requestAnimationFrame 合并滚动事件，避免每次 scroll 都读取布局属性造成抖动。
 * 同时监听 resize——图片加载完或窗口变化会改变文档总高度，不重算会导致百分比失真。
 */
export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      const pct = (window.scrollY / scrollable) * 100;
      setProgress(Math.min(100, Math.max(0, Math.round(pct))));
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return progress;
}
