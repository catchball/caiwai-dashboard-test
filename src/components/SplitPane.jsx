import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { T } from "../tokens";
import { useResizablePane } from "../utils";
import { MAX_PANE } from "../mockData";

const SplitArticleView = ({
  articleIds,
  renderLeft,
  renderRight,
  height = "calc(100vh - 380px)",
  storageKey = "caiwai-watch-split",
  defaultRatio = 0.55,
  containerStyle,
}) => {
  const [currentId, setCurrentId] = useState(null);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const { ratio: splitRatio, containerRef: splitContainerRef, onMouseDown: onSplitMouseDown, layoutMode: rawLayoutMode } = useResizablePane(storageKey, defaultRatio);
  const layoutMode = (rawLayoutMode === "left-only" && showDetailMobile) ? "right-only" : rawLayoutMode;

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const detailRefs = useRef({});
  const slimRefs = useRef({});
  const programmaticScrolling = useRef(false);
  const scrollAnimRef = useRef(null);

  const idKey = articleIds.join(",");
  useEffect(() => {
    if (articleIds.length > 0 && !articleIds.includes(currentId)) {
      setCurrentId(articleIds[0]);
    }
  }, [idKey]);

  useEffect(() => {
    return () => { if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current); };
  }, []);

  useEffect(() => {
    if (!rightPaneRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (programmaticScrolling.current) return;
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length === 0) return;
      visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const id = Number(visible[0].target.dataset.articleId);
      if (id) setCurrentId(id);
    }, { root: rightPaneRef.current, rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    Object.values(detailRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [idKey]);

  useEffect(() => {
    if (!currentId || programmaticScrolling.current) return;
    const el = slimRefs.current[currentId];
    const pane = leftPaneRef.current;
    if (!el || !pane) return;
    const elRect = el.getBoundingClientRect();
    const paneRect = pane.getBoundingClientRect();
    if (elRect.top >= paneRect.top && elRect.bottom <= paneRect.bottom) return;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentId]);

  const animateScroll = (element, target, duration = 200) => {
    if (scrollAnimRef.current) { cancelAnimationFrame(scrollAnimRef.current); scrollAnimRef.current = null; }
    const start = element.scrollTop;
    const distance = target - start;
    if (distance === 0) return;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || duration <= 0) { element.scrollTop = target; return; }
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      element.scrollTop = start + distance * easeOutCubic(progress);
      if (progress < 1) scrollAnimRef.current = requestAnimationFrame(tick);
      else scrollAnimRef.current = null;
    };
    scrollAnimRef.current = requestAnimationFrame(tick);
  };

  const onSlimClick = (id, slimEl) => {
    const wasAlreadyOpen = showDetailMobile;
    setCurrentId(id);
    setShowDetailMobile(true);
    programmaticScrolling.current = true;
    const isMobileLayout = layoutMode !== "both";
    const delay = (isMobileLayout && !wasAlreadyOpen) ? 320 : 0;
    const performScroll = () => {
      const detailEl = detailRefs.current[id];
      const rightPane = rightPaneRef.current;
      if (!detailEl || !rightPane) { programmaticScrolling.current = false; return; }
      const detailRect = detailEl.getBoundingClientRect();
      const paneRect = rightPane.getBoundingClientRect();
      const targetScrollTop = Math.max(0, rightPane.scrollTop + (detailRect.top - paneRect.top));
      animateScroll(rightPane, targetScrollTop, 200);
    };
    if (delay > 0) setTimeout(performScroll, delay); else performScroll();
    setTimeout(() => { programmaticScrolling.current = false; }, delay + 600);
  };

  const onBackToList = () => setShowDetailMobile(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape" && showDetailMobile) setShowDetailMobile(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showDetailMobile]);

  return (
    <div ref={splitContainerRef} className={`watch-v8 ${showDetailMobile ? "detail-mode" : ""} ${layoutMode === "left-only" ? "layout-left-only" : layoutMode === "right-only" ? "layout-right-only" : ""}`} style={{
      display: "flex", width: "100%",
      height, minHeight: 360,
      position: "relative",
      border: `1px solid ${T.border}`,
      borderRadius: T.rSm,
      overflow: "hidden",
      ...containerStyle,
    }}>
      <div ref={leftPaneRef} className="watch-left" style={{
        flex: 1, minWidth: 0, height: "100%", overflowY: "auto",
        background: T.card, padding: "0 16px",
      }}>
        {renderLeft({ slimRefs, currentId, onSlimClick, showDetailMobile })}
      </div>

      <div
        className="resize-handle"
        onMouseDown={onSplitMouseDown}
        style={{
          width: 7, cursor: "col-resize", flexShrink: 0,
          background: T.ink04, transition: "background .15s",
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.ink08; e.currentTarget.querySelector(".grip").style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.ink04; e.currentTarget.querySelector(".grip").style.opacity = "0.4"; }}
      >
        <div className="grip" style={{
          display: "flex", flexDirection: "column", gap: 3,
          opacity: 0.4, transition: "opacity .15s",
        }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: T.ink40 }} />)}
        </div>
      </div>

      <div
        className="back-rail"
        onClick={onBackToList}
        title="一覧に戻る"
        style={{
          width: 24, flexShrink: 0,
          background: "rgba(247,249,252,0.55)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          borderRight: `1px solid ${T.ink08}`,
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background .15s",
        }}
        onMouseEnter={e => { const icon = e.currentTarget.querySelector(".rail-icon"); if (icon) icon.style.opacity = "0.6"; }}
        onMouseLeave={e => { const icon = e.currentTarget.querySelector(".rail-icon"); if (icon) icon.style.opacity = "0.25"; }}
      >
        <ChevronLeft className="rail-icon" size={14} style={{ color: T.ink, opacity: 0.25, transition: "opacity .15s" }} />
      </div>

      <div
        ref={rightPaneRef}
        className={`watch-right ${showDetailMobile ? "show" : ""}`}
        style={{
          flex: "0 0 auto",
          width: `${(1 - splitRatio) * 100}%`,
          maxWidth: MAX_PANE, minWidth: 0,
          overflowY: "auto", padding: "6px 6px 32px",
          background: T.bg, scrollbarGutter: "stable",
        }}
      >
        {renderRight({ detailRefs })}
      </div>
    </div>
  );
};

export { SplitArticleView };
