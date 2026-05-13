/**
 * YouTubeLite — Lite Embed パターン
 *
 * サムネイル先行表示 → タップで iframe 生成
 * IntersectionObserver でビューポート近接時のみサムネロード
 * iframe は一度生成したら保持（再レンダリング防止）
 */
import { useState, useEffect, useRef, useCallback } from "react";

/* ── YouTube サムネイル URL ── */
const thumbUrl = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/* ── 単一動画コンポーネント ── */
export default function YouTubeLite({
  videoId,
  title = "",
  aspectRatio = 56.25, // 16:9 = 56.25%
  style = {},
}) {
  const [activated, setActivated] = useState(false);
  const [thumbVisible, setThumbVisible] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const containerRef = useRef(null);

  // IntersectionObserver: ビューポート近接でサムネロード
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setThumbVisible(true); obs.disconnect(); } },
      { rootMargin: "600px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleActivate = useCallback(() => {
    setActivated(true);
  }, []);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${aspectRatio}%`,
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
        cursor: activated ? "default" : "pointer",
        ...style,
      }}
      onClick={!activated ? handleActivate : undefined}
      role={!activated ? "button" : undefined}
      aria-label={!activated ? `${title || "動画"}を再生` : undefined}
      tabIndex={!activated ? 0 : undefined}
      onKeyDown={!activated ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleActivate(); } } : undefined}
    >
      {/* iframe（アクティベート後） */}
      {activated && (
        <iframe
          src={embedUrl}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%", border: "none",
          }}
        />
      )}

      {/* サムネイル（アクティベート前） */}
      {!activated && (
        <>
          {thumbVisible && !thumbError && (
            <img
              src={thumbUrl(videoId)}
              alt={title || ""}
              loading="lazy"
              onError={() => setThumbError(true)}
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%", objectFit: "cover",
              }}
            />
          )}

          {/* フォールバック背景（サムネ未ロード or エラー） */}
          {(!thumbVisible || thumbError) && (
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 32, color: "rgba(255,255,255,0.3)" }}>▶</span>
            </div>
          )}

          {/* 再生ボタンオーバーレイ */}
          <div style={styles.playOverlay}>
            <div style={styles.playButton}>
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path
                  d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                  fill="#FF0000"
                />
                <path d="M45 24L27 14v20" fill="#fff" />
              </svg>
            </div>
          </div>

          {/* タイトル表示（あれば） */}
          {title && (
            <div style={styles.titleBar}>
              <span style={styles.titleText}>{title}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── スタイル ── */
const styles = {
  playOverlay: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.08)",
    transition: "background 0.2s",
  },
  playButton: {
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
    transition: "transform 0.15s",
  },
  titleBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "8px 12px",
    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
  },
  titleText: {
    color: "#fff", fontSize: 13, fontWeight: 500,
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
};
