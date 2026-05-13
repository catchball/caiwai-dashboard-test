/**
 * XEmbed — X (Twitter) 埋め込み最適化コンポーネント
 *
 * mizkan-natto_03.html のパターンを React 化:
 * - 同時実行制御キュー（MAX_CONCURRENCY = 2）
 * - IntersectionObserver による遅延読み込み
 * - スケルトン → embed → fallback の3段階
 * - タイムアウト + リトライ（クールダウン付き）
 * - renderToken によるステイル防止
 */
import { useState, useEffect, useRef, useCallback } from "react";

/* ── 定数 ── */
const MAX_CONCURRENCY = 2;
const EMBED_TIMEOUT_MS = 10_000;
const RETRY_COOLDOWN_MS = 3_000;
const OBSERVER_ROOT_MARGIN = "800px 0px";
const MAX_EMBED_WIDTH = 550;

/* ── Twitter SDK ローダー ── */
let _sdkPromise = null;
const loadTwitterSdk = () => {
  if (_sdkPromise) return _sdkPromise;
  _sdkPromise = new Promise((resolve) => {
    if (window.twttr?.widgets) return resolve(window.twttr);
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.onload = () => {
      let tries = 0;
      const tick = () => {
        if (window.twttr?.widgets) return resolve(window.twttr);
        if (++tries > 30) { _sdkPromise = null; return resolve(null); }
        setTimeout(tick, 100);
      };
      tick();
    };
    s.onerror = () => { _sdkPromise = null; resolve(null); };
    document.head.appendChild(s);
  });
  return _sdkPromise;
};

/* ── 同時実行制御キュー ── */
const createQueue = (concurrency = MAX_CONCURRENCY) => {
  let active = 0;
  const pending = [];
  const pump = () => {
    while (active < concurrency && pending.length) {
      const job = pending.shift();
      active++;
      job().finally(() => { active--; pump(); });
    }
  };
  return {
    enqueue: (fn) => { pending.push(fn); pump(); },
    clear: () => { pending.length = 0; },
    get size() { return active + pending.length; },
  };
};

/* ── 単一ツイート埋め込みコンポーネント ── */
function TweetEmbed({ tweetId, width = MAX_EMBED_WIDTH, queue, token, tokenRef }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("pending"); // pending | loading | done | error
  const [visible, setVisible] = useState(false);
  const lastRetryRef = useRef(0);

  // IntersectionObserver: ビューポート近接でvisible=true
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // visible になったら SDK ロード → embed
  useEffect(() => {
    if (!visible || status !== "pending") return;
    setStatus("loading");

    queue.enqueue(() => new Promise((resolve) => {
      // ステイル防止
      if (tokenRef.current !== token) { resolve(); return; }

      const el = containerRef.current?.querySelector(".x-embed-clip");
      if (!el) { resolve(); return; }

      const runIdle = window.requestIdleCallback
        ? (fn) => requestIdleCallback(fn, { timeout: 1000 })
        : (fn) => setTimeout(fn, 0);

      runIdle(async () => {
        const twttr = await loadTwitterSdk();
        if (!twttr?.widgets?.createTweet) {
          setStatus("error");
          resolve();
          return;
        }
        if (tokenRef.current !== token) { resolve(); return; }

        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };

        const timeout = setTimeout(() => {
          if (!resolved) { setStatus("error"); done(); }
        }, EMBED_TIMEOUT_MS);

        try {
          await twttr.widgets.createTweet(tweetId, el, {
            theme: "light", width, dnt: true, conversation: "none",
          });
          clearTimeout(timeout);
          if (!resolved) setStatus("done");
        } catch {
          clearTimeout(timeout);
          if (!resolved) setStatus("error");
        } finally {
          done();
        }
      });
    }));
  }, [visible, status, tweetId, width, queue, token, tokenRef]);

  const handleRetry = useCallback(() => {
    const now = Date.now();
    if (now - lastRetryRef.current < RETRY_COOLDOWN_MS) return;
    lastRetryRef.current = now;
    // clip をクリアして再トライ
    const clip = containerRef.current?.querySelector(".x-embed-clip");
    if (clip) clip.innerHTML = "";
    setStatus("pending");
    setVisible(true); // 即座にトリガー
  }, []);

  return (
    <div ref={containerRef} style={{ marginBottom: 12 }}>
      {/* スケルトン or embed結果を入れるclip */}
      <div className="x-embed-clip" style={{ minHeight: status === "done" ? "auto" : 120 }} />

      {/* ローディング中スケルトン */}
      {status === "loading" && (
        <div style={styles.skeleton}>
          <div style={styles.skelIcon}>𝕏</div>
          <div style={styles.skelBar} />
          <div style={{ ...styles.skelBar, width: "60%" }} />
        </div>
      )}

      {/* pending (IO待ち) スケルトン */}
      {status === "pending" && (
        <div style={styles.skeleton}>
          <div style={styles.skelIcon}>𝕏</div>
          <div style={styles.skelBar} />
        </div>
      )}

      {/* エラー → fallback + リトライ */}
      {status === "error" && (
        <div style={styles.fallback}>
          <div style={styles.fallbackRow}>
            <span style={styles.fallbackBadge}>𝕏</span>
            <span style={styles.fallbackText}>埋め込みを表示できませんでした</span>
          </div>
          <div style={styles.fallbackActions}>
            <button onClick={handleRetry} style={styles.retryBtn}>↻ 再読み込み</button>
            <a
              href={`https://x.com/i/web/status/${tweetId}`}
              target="_blank" rel="noopener noreferrer"
              style={styles.openLink}
            >
              Xで開く
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── メインコンポーネント: ツイートリスト ── */
export default function XEmbedList({ tweetIds = [], width = MAX_EMBED_WIDTH }) {
  const [queue] = useState(() => createQueue());
  const tokenRef = useRef(0);

  // tweetIds が変わったらキューをリセット
  useEffect(() => {
    tokenRef.current++;
    queue.clear();
  }, [tweetIds, queue]);

  if (!tweetIds.length) {
    return <div style={{ padding: 24, textAlign: "center", color: "#888" }}>表示するポストがありません</div>;
  }

  const currentToken = tokenRef.current;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {tweetIds.map((id) => (
        <TweetEmbed
          key={id}
          tweetId={id}
          width={width}
          queue={queue}
          token={currentToken}
          tokenRef={tokenRef}
        />
      ))}
    </div>
  );
}

/* ── スタイル ── */
const styles = {
  skeleton: {
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    animation: "xSkelPulse 1.5s ease-in-out infinite",
  },
  skelIcon: {
    width: 28, height: 28, borderRadius: "50%",
    background: "#e2e8f0", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 14, color: "#94a3b8",
  },
  skelBar: {
    height: 12, borderRadius: 6, background: "#e2e8f0", width: "80%",
  },
  fallback: {
    background: "#fafafa", borderRadius: 12, padding: "16px 20px",
    border: "1px solid #e2e8f0",
  },
  fallbackRow: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
  },
  fallbackBadge: {
    width: 24, height: 24, borderRadius: "50%", background: "#0f1419",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700,
  },
  fallbackText: {
    fontSize: 13, color: "#64748b",
  },
  fallbackActions: {
    display: "flex", gap: 8, alignItems: "center",
  },
  retryBtn: {
    border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px",
    background: "#fff", cursor: "pointer", fontSize: 12, color: "#374151",
  },
  openLink: {
    fontSize: 12, color: "#3b82f6", textDecoration: "none",
  },
};
