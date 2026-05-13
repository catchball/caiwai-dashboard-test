/* ═══════════════════════════════════════════════════════════
   caiwai 分析モード v10 — メインオーケストレーター
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { T, font } from "./tokens";
import { _parseDate, isNewArticle, filterByPeriod, matchType, adaptArticle } from "./utils";
import {
  ARTICLES, INITIAL_ARTICLES, LAST_SEEN_DATE,
  TORIATSUKAI_DEFAULT, PERIOD_OPTIONS, DATA_DATE_RANGE,
  HIGHLIGHT_SEGMENTS, HIGHLIGHT_COLLAPSED, HIGHLIGHT_DATE
} from "./mockData";
import { SourcePills, SegmentControl, NewsSubPills } from "./components/Filters";
import { Header, ShareFab } from "./components/Header";
import { lazy, Suspense } from "react";
import { WatchModeV8, WatchInsightBar } from "./components/WatchMode";

// Lazy load: Analysis views (recharts 500KB) and ReportMode not needed on initial Watch screen
const ViewQuantity = lazy(() => import("./components/AnalysisViews").then(m => ({ default: m.ViewQuantity })));
const ViewV5 = lazy(() => import("./components/AnalysisViews").then(m => ({ default: m.ViewV5 })));
const ReportMode = lazy(() => import("./components/ReportMode").then(m => ({ default: m.ReportMode })));
import {
  InviteFormModal, InviteSuccessModal,
  SettingsModal, SignupCompleteScreen, AllCaughtUpToast
} from "./components/Modals";

const GLOBAL_CSS = `
        @keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes ring { 0%{opacity:.5;transform:scale(.8)} 100%{opacity:0;transform:scale(1.8)} }

        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          /* モード切替時のスクロールバー出現/消失によるガタつき防止 */
          overflow-y: scroll;          /* 旧ブラウザ用フォールバック */
          scrollbar-gutter: stable;    /* モダンブラウザ：スクロールバー領域を常時確保 */
        }
        body { margin: 0; }
        *, *::before, *::after, input, textarea, select, button { font-family: "Noto Sans JP", "Plus Jakarta Sans", system-ui, sans-serif; }

        .article-card { transition: background .12s ease, transform .1s ease; }
        @media (hover: hover) {
          .article-card:hover { background: rgba(15,23,42,.015) !important; }
        }
        .article-card:active { transform: scale(.985); background: rgba(15,23,42,.03) !important; }

        @keyframes bookmarkPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .bookmark-btn:active { animation: bookmarkPop .25s ease; }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp {
          from { transform: translateY(100%); opacity: .8; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes gentleIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (hover: hover) {
          .article-card:hover img { filter: brightness(1.04); }
        }

        .sheet-actions button:active { transform: scale(.96); }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(15,23,42,.1); border-radius: 4px; }

        /* watch ペイン：スクロールバー完全非表示（スクロールは有効） */
        .watch-left, .watch-right {
          scrollbar-width: none;
        }
        .watch-left::-webkit-scrollbar, .watch-right::-webkit-scrollbar {
          display: none;
        }

        /* ── レイアウト：grid template に任せる（watch-v8 は main 外、左右余白等分、中余白 0） ── */
        .watch-left, .watch-right {
          box-sizing: border-box;
        }
        .watch-left {
          position: relative;
        }
        /* 2カラム: デフォルト */
        .back-rail { display: none; }

        /* 1カラムモード: ペイン幅ベースでクラス切替 */

        /* left-only: 左ペイン全画面、右非表示 */
        .watch-v8.layout-left-only .resize-handle { display: none !important; }
        .watch-v8.layout-left-only .watch-left { width: 100% !important; }
        .watch-v8.layout-left-only .watch-right { display: none !important; flex: none !important; }


        /* right-only: 右ペイン全画面、左を背面に */
        .watch-v8.layout-right-only .resize-handle { display: none !important; }
        .watch-v8.layout-right-only { position: relative; }
        .watch-v8.layout-right-only .watch-left {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          z-index: 0;
        }
        .watch-v8.layout-right-only .watch-right {
          flex: 0 1 560px !important; min-width: 0 !important;
          width: auto !important;
          position: relative; z-index: 1;
        }
        .watch-v8.layout-right-only .back-rail {
          display: flex !important;
          position: relative; z-index: 1;
          margin-left: auto;
        }
        @media (max-width: 480px) {
          .watch-v8.layout-right-only .back-rail { display: none !important; }
        }
        .watch-left::after {
          content: '';
          position: sticky;
          bottom: 0; left: 0; right: 0;
          height: 32px;
          display: block;
          background: linear-gradient(transparent, rgba(255,255,255,.85));
          pointer-events: none;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .watch-right {
            padding: 16px 8px 32px !important;
          }
          .detail-card {
            padding: 20px 12px 16px !important;
          }
        }

        @media (max-width: 640px) {
          .hdr-meta-data { display: none !important; }
          .hdr-top { padding-left: 16px !important; padding-right: 16px !important; }
          .src-count { display: none !important; }
          .watch-statusbar { display: none !important; }
          .main-content { padding-left: 16px !important; padding-right: 16px !important; }
          .hdr-plan-toggle { display: none !important; }
          .hdr-invite-text { display: none !important; }
          .hdr-invite-btn { padding: 0 !important; width: 30px !important; border-radius: 6px !important; }
        }

        /* ── 上段モードタブ：常時表示 ── */
        .hdr-mode-tabs { display: flex; }

        /* ── ボトムナビ：廃止（CSS で隠す） ── */
        .bottom-nav { display: none !important; }


  /* B-4: スマホ時はチャートのstickyを解除（コントロールバーのみ残す） */
  @media (max-width: 768px) {
    .v10-chart-wrap {
      position: static !important;
      z-index: auto !important;
    }
    .analysis-detail-pane { display: none !important; }
  }
`;


export default function AnalysisV10({
  sheetArticles,
  sheetHighlights,
  sheetDetections,
  sheetDomains,
} = {}) {
  // ── 共通ナビ state（v8 と同一構造） ──
  const [mode, setMode] = useState("watch");
  const [activeSource, setActiveSource] = useState("all");
  const [isPremium, setIsPremium] = useState(false); // demo: Free/Premium 切替

  // ── スプシ接続フラグ ──
  const hasSheetArticles = Array.isArray(sheetArticles) && sheetArticles.length > 0;
  const hasSheetHighlights = Array.isArray(sheetHighlights) && sheetHighlights.length > 0;

  // ── 一覧モード用：sheet があれば adaptArticle して INITIAL_ARTICLES の代わりに ──
  const initialArticles = useMemo(() => {
    if (hasSheetArticles) return sheetArticles.map(adaptArticle);
    return INITIAL_ARTICLES;
  }, [hasSheetArticles, sheetArticles]);

  // 分析モード用：sheet があれば raw articles を、なければ ARTICLES を使う
  const analysisArticles = useMemo(() => {
    return hasSheetArticles ? sheetArticles : ARTICLES;
  }, [hasSheetArticles, sheetArticles]);

  // ヘッダー用 データ日付範囲（sheet 接続時は動的算出）
  const dataDateRange = useMemo(() => {
    if (!hasSheetArticles) return DATA_DATE_RANGE;
    const sorted = [...new Set(sheetArticles.map(a => a.date).filter(Boolean))]
      .sort((a, b) => _parseDate(a) - _parseDate(b));
    if (sorted.length === 0) return DATA_DATE_RANGE;
    const fmt = (s) => {
      const [m, d] = s.split("/");
      return String(m).padStart(2, "0") + "/" + String(d).padStart(2, "0");
    };
    return `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`;
  }, [hasSheetArticles, sheetArticles]);

  // ハイライト：sheet 最新行 > mock
  const latestHighlight = useMemo(() => {
    if (hasSheetHighlights) {
      const sorted = [...sheetHighlights].sort((a, b) => _parseDate(b.date) - _parseDate(a.date));
      return sorted[0];
    }
    return { date: HIGHLIGHT_DATE, segments: HIGHLIGHT_SEGMENTS, collapsed: HIGHLIGHT_COLLAPSED };
  }, [hasSheetHighlights, sheetHighlights]);

  // last seen：sheet データの最新日の1つ前を仮定 (なければ mock LAST_SEEN_DATE)
  const lastSeenDate = useMemo(() => {
    if (!hasSheetArticles) return LAST_SEEN_DATE;
    const sorted = [...new Set(sheetArticles.map(a => a.date).filter(Boolean))]
      .sort((a, b) => _parseDate(b) - _parseDate(a));
    return sorted[1] || sorted[0] || LAST_SEEN_DATE;
  }, [hasSheetArticles, sheetArticles]);

  // ── 一覧モード state ──
  const [articles, setArticles] = useState(initialArticles);
  // sheet データが到着したら articles を差し替え
  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);
  const unreadCount = articles.filter(a => isNewArticle(a, lastSeenDate)).length;

  // ── 分析モード固有 state（定量/定性 + ドリル history） ──
  const [activeVp, setActiveVp] = useState("qty");
  const [filter, setFilter] = useState({});
  const [analysisPeriod, setAnalysisPeriod] = useState("14d");
  const [newsSubType, setNewsSubType] = useState("all-news");
  const [toriatsukaiFilter, setToriatsukaiFilter] = useState(TORIATSUKAI_DEFAULT);
  const [searchKeyword, setSearchKeyword] = useState("");

  // ── 招待UI state（v2 §7.5 文脈適応設計） ──
  const [inviteCount, setInviteCount] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [showInviteSuccess, setShowInviteSuccess] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignupComplete, setShowSignupComplete] = useState(false);
  const [showCaughtUpToast, setShowCaughtUpToast] = useState(false);
  const [inviteSpot, setInviteSpot] = useState(false);

  const dismissInviteSpot = () => setInviteSpot(false);

  // 文脈適応3状態（A 初期 / B 通常 / C 強調）
  const inviteButtonState = useMemo(() => {
    if (inviteSpot) return "spot";
    if (inviteCount === 0) return "initial";
    return "normal";
  }, [inviteSpot, inviteCount]);

  const handleAnalysisBookmark = useCallback((id) => {
    if (!isPremium) return;
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
  }, [isPremium]);

  const handleNavigate = useCallback((vpId, newFilter = {}) => {
    setActiveVp(vpId);
    setFilter(newFilter);
  }, []);

  const handleTabChange = (vpId) => {
    setActiveVp(vpId);
    setFilter({});
  };

  // ニュース以外に切り替えたらサブタイプをリセット
  useEffect(() => { if (activeSource !== "news") setNewsSubType("all-news"); }, [activeSource]);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── グローバル CSS（v8 と一致） ── */}
      <style>{GLOBAL_CSS}</style>

      {/* ── 共通ヘッダー ── */}
      <Header
        activeMode={mode} setActiveMode={setMode}
        isPremium={isPremium} setIsPremium={setIsPremium}
        inviteButtonState={inviteButtonState}
        onClickInvite={() => { dismissInviteSpot(); setShowInvite(true); }}
        onClickSettings={() => { dismissInviteSpot(); setShowSettings(true); }}
        dataDateRange={dataDateRange}
      />

      {/* ── 一覧モード：main の外に配置（grid 3余白等分のため） ── */}
      {mode === "watch" && (
        <WatchModeV8
          articles={articles}
          setArticles={setArticles}
          isPremium={isPremium}
          activeType={activeSource}
          setActiveType={setActiveSource}
          unreadCount={unreadCount}
          onSetMode={setMode}
          newsSubType={newsSubType}
          setNewsSubType={setNewsSubType}
          toriatsukaiFilter={toriatsukaiFilter}
          setToriatsukaiFilter={setToriatsukaiFilter}
          searchKeyword={searchKeyword}
          highlight={latestHighlight}
          lastSeenDate={lastSeenDate}
        />
      )}

      {/* ── メインコンテンツ（分析・レポート） ── */}
      {mode !== "watch" && (
      <main className="main-content" style={{
        flex: 1,
        margin: "0 auto", width: "100%",
        padding: "16px 24px 48px",
      }}>
        {mode === "analysis" && (
          <>
            {/* 分析モード コントロールバー — 全操作を1行に集約 */}
            <div style={{
              position: "sticky",
              top: 52,
              zIndex: 8,
              background: T.bg,
              padding: "8px 0",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}>
              {/* 定量/定性 切替 */}
              <SegmentControl
                options={[
                  { id: "qty", label: "定量" },
                  { id: "v5",  label: "定性" },
                ]}
                value={activeVp}
                onChange={handleTabChange}
              />

              {/* ソースタイプ ピル（watchと同じカラー体系） */}
              <SourcePills active={activeSource} onChange={setActiveSource} toriatsukaiFilter={toriatsukaiFilter} onToriatsukaiChange={setToriatsukaiFilter} />

              {/* 期間セレクター */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.ink40, whiteSpace: "nowrap" }}>期間</span>
                <SegmentControl
                  options={PERIOD_OPTIONS}
                  value={analysisPeriod}
                  onChange={setAnalysisPeriod}
                />
              </div>

              {/* 区切り線 */}
              <div style={{ width: 1, height: 20, background: T.ink08, flexShrink: 0 }} />

              {/* キーワード検索 */}
              <div style={{
                flex: 1, minWidth: 140, maxWidth: 280,
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px",
                borderRadius: T.rSm,
                border: `1px solid ${T.ink08}`,
                background: T.card,
              }}>
                <Search size={13} style={{ color: T.ink20, flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="キーワードで絞り込み"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    fontSize: 12, color: T.ink80,
                    width: "100%",
                  }}
                />
                {searchKeyword && (
                  <X size={12}
                    style={{ color: T.ink40, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => setSearchKeyword("")}
                  />
                )}
              </div>
            </div>

            {/* ニュース子階層（news選択時のみ表示） */}
            {activeSource === "news" && (
              <div style={{ marginBottom: 8 }}>
                <NewsSubPills active={newsSubType} onChange={setNewsSubType} />
              </div>
            )}

            <div style={{
              background: T.card, borderRadius: T.r,
              border: `1px solid ${T.border}`, boxShadow: T.shadow,
              padding: "16px",
            }}>
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: T.ink40, fontSize: 13 }}>Loading...</div>}>
              {activeVp === "qty" && (
                <ViewQuantity
                  filter={filter}
                  onNavigate={handleNavigate}
                  sourceFilter={activeSource}
                  period={analysisPeriod}
                  newsSubType={newsSubType}
                  onBookmark={handleAnalysisBookmark}
                  toriatsukaiFilter={toriatsukaiFilter}
                  articles={analysisArticles}
                  highlight={latestHighlight}
                  domains={sheetDomains}
                />
              )}
              {activeVp === "v5" && (
                <ViewV5
                  filter={filter}
                  onNavigate={handleNavigate}
                  period={analysisPeriod}
                  onBookmark={handleAnalysisBookmark}
                  toriatsukaiFilter={toriatsukaiFilter}
                  articles={analysisArticles}
                />
              )}
              </Suspense>
            </div>
          </>
        )}

        {mode === "report" && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: T.ink40, fontSize: 13 }}>Loading...</div>}>
            <ReportMode />
          </Suspense>
        )}
      </main>
      )}

      <ShareFab activeMode={mode} />

      <footer style={{
        textAlign: "center", padding: "16px 0 20px",
        fontSize: 12, fontWeight: 500, color: T.ink40,
      }}>
        Curated and Processed by catchball Inc.
      </footer>

      {/* ── 招待UI モーダル群（v2 §7.5 文脈適応設計） ── */}
      {showInvite && (
        <InviteFormModal
          userId="shin0001"
          onClose={() => setShowInvite(false)}
          onSent={(email) => {
            setShowInvite(false);
            setShowInviteSuccess({ recipientEmail: email });
            setInviteCount((c) => {
              const next = c + 1;
              if (next === 3) setInviteSpot(true);
              return next;
            });
          }}
        />
      )}
      {showInviteSuccess && (
        <InviteSuccessModal
          recipientEmail={showInviteSuccess.recipientEmail}
          totalSent={inviteCount}
          onSendAnother={() => {
            setShowInviteSuccess(null);
            setShowInvite(true);
          }}
          onClose={() => setShowInviteSuccess(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          inviteCount={inviteCount}
          userId="shin0001"
          onClose={() => setShowSettings(false)}
          onInvite={() => {
            setShowSettings(false);
            setShowInvite(true);
          }}
        />
      )}
      {showSignupComplete && (
        <SignupCompleteScreen
          magazineName="納豆"
          referrerName="山田太郎"
          referrerCompany="ABC食品"
          totalReferrals={12}
          onPrimary={() => {
            setShowSignupComplete(false);
            setShowInvite(true);
          }}
          onPreview={() => setShowSignupComplete(false)}
          onSkip={() => setShowSignupComplete(false)}
        />
      )}
      {showCaughtUpToast && (
        <AllCaughtUpToast
          onInvite={() => {
            setShowCaughtUpToast(false);
            setShowInvite(true);
          }}
          onDismiss={() => setShowCaughtUpToast(false)}
        />
      )}
    </div>
  );
}
