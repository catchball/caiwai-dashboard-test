import { useState, useCallback, useRef, useEffect } from "react";
import {
  BarChart3, Newspaper, Youtube, Twitter, List, FileText,
  Bell, Settings, UserPlus, Search, SlidersHorizontal,
  Map, Send, ArrowRight, Mail, Copy, CheckCircle2, Share2
} from "lucide-react";
import { T, font } from "../tokens";
import { shareViaUrl } from "../utils";
import { DATA_DATE_RANGE } from "../mockData";
import { SegmentControl } from "./Filters";

/* ═══════════════════════════════════════════════════════════
   HEADER — 統一ヘッダー（全モード共通・1行）
   ブランドバー: caiwAi + カテゴリ名 + プラン + モード切替セグメント + 通知/設定/ヘルプ
   モード別コントロールは各モード内に配置（Header下段は廃止）
   ═══════════════════════════════════════════════════════════ */

const Header = ({ activeMode, setActiveMode, isPremium, setIsPremium, inviteButtonState = "initial", onClickInvite, onClickSettings }) => (
  <header style={{ position: "sticky", top: 0, zIndex: 100, background: T.navy }}>
    {/* ── 上段: ブランド + ユーティリティ ── */}
    <div className="hdr-top" style={{
      margin: "0 auto", padding: "8px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* カテゴリ + プロダクト名（納豆 caiwai、両者対等）— クリックで一覧モードに戻る（Web慣習） */}
        <div
          onClick={() => setActiveMode("watch")}
          title="ホームに戻る"
          style={{ display: "inline-flex", alignItems: "baseline", gap: 10, marginRight: 10, cursor: "pointer" }}
        >
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>
            納豆
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>
            caiw<span style={{ color: T.accent }}>ai</span>
          </span>
        </div>
        {/* DATA — モバイルで非表示 */}
        <div className="hdr-meta-data" style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "0 10px", height: 20,
          borderLeft: "1px solid rgba(255,255,255,.07)",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
            color: "rgba(255,255,255,.70)", textTransform: "uppercase",
            padding: "1.5px 5px", borderRadius: 3,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
          }}>DATA</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{DATA_DATE_RANGE}</span>
        </div>

      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Demo: plan toggle（≤640pxで非表示） */}
        <button className="hdr-plan-toggle" onClick={() => setIsPremium(!isPremium)} style={{
          padding: "3px 10px", borderRadius: T.rPill, border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 700, letterSpacing: ".03em",
          background: isPremium ? "rgba(99,102,241,.25)" : "rgba(255,255,255,.08)",
          color: isPremium ? T.accent : "rgba(255,255,255,.35)",
          transition: "all .15s", marginRight: 4,
        }}>
          {isPremium ? "Premium" : "Free"}
        </button>
        {/* モード切替セグメント（PC専用：≥1024pxで表示。スマホ・タブレットはボトムナビ） */}
        <div className="hdr-mode-tabs" style={{
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,.06)",
          borderRadius: 8, padding: 2, gap: 1, marginRight: 2,
          border: "1px solid rgba(255,255,255,.06)",
        }}>
          {[
            { id: "watch", icon: List, free: true, label: "一覧" },
            { id: "analysis", icon: BarChart3, free: false, label: "分析" },
            { id: "report", icon: FileText, free: false, label: "レポート" },
          ].map(m => {
            const active = activeMode === m.id;
            const locked = !m.free && !isPremium;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                title={m.label}
                style={{
                  position: "relative",
                  width: 26, height: 24, borderRadius: 6,
                  border: "none", cursor: "pointer",
                  background: active ? "rgba(99,102,241,.25)" : "transparent",
                  color: active ? "#fff" : locked ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.50)",
                  display: "grid", placeItems: "center",
                  transition: "all .15s",
                }}
              >
                <m.icon size={12} />
                {locked && !active && (
                  <span style={{
                    position: "absolute", top: -1, right: -1,
                    width: 4, height: 4, borderRadius: "50%",
                    background: T.accent,
                  }} />
                )}
              </button>
            );
          })}
        </div>
        {/* 「招待を送る」ボタン（v2 §7.5 文脈適応3状態：initial / normal / spot） */}
        {(() => {
          const isInitial = inviteButtonState === "initial";
          const isSpot = inviteButtonState === "spot";
          return (
            <button
              className="hdr-invite-btn"
              onClick={onClickInvite}
              title="業界の方にどうぞ。caiwai は招待を歓迎しています。"
              style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 5,
                height: 30,
                padding: isInitial ? "0 10px 0 9px" : 0,
                width: isInitial ? "auto" : 30,
                borderRadius: isInitial ? T.rPill : 6,
                border: `1px solid ${isInitial ? "rgba(99,102,241,.45)" : "rgba(255,255,255,.08)"}`,
                background: isInitial ? "rgba(99,102,241,.20)" : "rgba(255,255,255,.03)",
                color: isInitial ? "#fff" : "rgba(255,255,255,.50)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                marginRight: 2,
                transition: "all .15s",
              }}
            >
              <Mail size={13} />
              {isInitial && <span className="hdr-invite-text">招待</span>}
              {isSpot && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#f59e0b", border: `1.5px solid ${T.navy}`,
                }} />
              )}
            </button>
          );
        })()}
        {[
          { icon: Bell, badge: true, cls: "", onClick: undefined },
          { icon: Settings, cls: "hdr-btn-settings", onClick: onClickSettings },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} className={btn.cls} title={btn.title} style={{
            position: "relative", width: 30, height: 30, borderRadius: 6,
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.50)",
            display: "grid", placeItems: "center", cursor: "pointer",
          }}>
            <btn.icon size={13} />
            {btn.badge && <span style={{
              position: "absolute", top: 4, right: 4,
              width: 6, height: 6, borderRadius: "50%",
              background: T.accent, border: `1.5px solid ${T.navy}`,
            }} />}
          </button>
        ))}
      </div>
    </div>


  </header>
);



/* ═══════════════════════════════════════════════════════════
   SHARE FAB — Watch モード時のみ表示、scroll-aware auto-hide
   ・タップ → URL 生成（モック）→ Web Share API or クリップボードコピー
   ・24時間有効URL の発行、登録不要で受け手は閲覧可能（バックエンド側仕様）
   ・下スクロール時は隠れる（フィード没入を妨げない）
   ・詳細パネル開時も表示維持（パネル内のシェアボタンと併存）
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   SHARE FAB — Watch モード時のみ表示、scroll-aware auto-hide
   ・タップ → URL 生成（モック）→ Web Share API or クリップボードコピー
   ・24時間有効URL の発行、登録不要で受け手は閲覧可能（バックエンド側仕様）
   ・下スクロール時は隠れる（フィード没入を妨げない）
   ・詳細パネル開時も表示維持（パネル内のシェアボタンと併存）
   ═══════════════════════════════════════════════════════════ */
const ShareFab = ({ activeMode }) => {
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const lastScrollY = useRef(0);

  // scroll-aware auto-hide（内部スクロール .watch-left も含めて捕まえる）
  useEffect(() => {
    // 初回スクロール位置を取り込む（リロード時の位置復元によるFAB誤隠し対策）
    lastScrollY.current = window.scrollY || document.documentElement.scrollTop || 0;

    const onScroll = (e) => {
      const t = e.target;
      let cy = 0;
      if (t === document || t === window || t === document.documentElement || t === document.body) {
        cy = window.scrollY || document.documentElement.scrollTop || 0;
      } else if (t && typeof t.scrollTop === "number") {
        cy = t.scrollTop;
      }
      const dy = cy - lastScrollY.current;
      if (Math.abs(dy) > 8) {
        setHidden(dy > 0 && cy > 64);
        lastScrollY.current = cy;
      }
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  // 詳細パネル（.watch-right.show）監視 — 開時は FAB を隠す
  // 詳細パネル内のシェアボタン（A1）にユーザーが向かうため、コンテキスト不一致を防ぐ
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => {
    const target = document.querySelector(".watch-v8");
    if (!target) return;
    const check = () => setDetailOpen(!!target.querySelector(".watch-right.show"));
    const observer = new MutationObserver(check);
    observer.observe(target, { subtree: true, attributes: true, attributeFilter: ["class"] });
    check();
    return () => observer.disconnect();
  }, []);

  // Watch モード以外は表示しない（Free 共有は今のところ Watch のみ成立）
  if (activeMode !== "watch") return null;

  const handleShare = async () => {
    // TODO: 本番ではカテゴリ名・日付・共有者名を props または context から動的に渡す
    const result = await shareViaUrl({
      title: "今日の納豆 caiwai",
      text: "業界の今日の整理を共有します（24時間限定）",
    });
    if (result.cancelled) return;
    setToast(result.message);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <>
      <button
        onClick={handleShare}
        title="共有する（24時間有効URL）"
        aria-label="共有"
        className="share-fab"
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          width: 48, height: 48,
          borderRadius: "50%",
          background: T.card,
          border: `1px solid ${T.accentBorder}`,
          color: T.accent,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(99,102,241,0.18), 0 1px 3px rgba(15,23,42,0.06)",
          transform: (hidden || detailOpen) ? "translateY(140%)" : "translateY(0)",
          transition: "transform .22s cubic-bezier(.22,1,.36,1)",
          zIndex: 80,
        }}
      >
        <Share2 size={20} strokeWidth={2.2} />
      </button>
      {toast && (
        <div role="status" style={{
          position: "fixed",
          bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
          right: 16,
          padding: "10px 14px",
          borderRadius: 8,
          background: T.navy,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(15,23,42,0.2)",
          zIndex: 81,
          maxWidth: 240,
        }}>
          {toast}
        </div>
      )}
    </>
  );
};

export { Header, ShareFab };
