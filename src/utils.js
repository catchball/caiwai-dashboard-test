import { useState, useRef, useCallback, useEffect } from "react";
import { T } from "./tokens";

const _parseDate = (s) => { if (typeof s !== "string" || !s) return 0; const [m,d] = s.split("/").map(Number); return m * 100 + d; };


/* ═══════════════════════════════════════════════════════════
   共通：共有 URL 発行 + Web Share API or クリップボードコピー
   ShareFab / DetailCard / AllCaughtUp など複数箇所から呼ばれる
   ═══════════════════════════════════════════════════════════ */
const shareViaUrl = async ({ title, text, urlSuffix = "" }) => {
  // モック: UUID風文字列を生成。本番はバックエンド発行
  const uuid = Math.random().toString(36).slice(2, 10);
  const url = `https://caiwai.app/s/${uuid}${urlSuffix}`;
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, message: "シェアしました" };
    } catch (e) { return { ok: false, cancelled: true }; }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, message: "✓ URLをコピーしました（24時間有効）" };
    } catch (e) { return { ok: false, message: "コピーに失敗しました" }; }
  }
  return { ok: false, message: "お使いのブラウザは共有非対応です" };
};

/* ═══════════════════════════════════════════════════════════
   共通ナビ部品（v8 と一致）
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   共起語カラーパレット（色固定用・最大12色）
   ═══════════════════════════════════════════════════════════ */
const WORD_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#0ea5e9", // sky
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
  "#d946ef", // fuchsia
  "#64748b", // slate
];
const _WORD_COLOR_MAP = {};
let _colorIdx = 0;
const getWordColor = (word) => {
  if (_WORD_COLOR_MAP[word]) return _WORD_COLOR_MAP[word];
  if (Object.isFrozen(_WORD_COLOR_MAP)) {
    return WORD_COLORS[word.length % WORD_COLORS.length];
  }
  _WORD_COLOR_MAP[word] = WORD_COLORS[_colorIdx % WORD_COLORS.length];
  _colorIdx++;
  return _WORD_COLOR_MAP[word];
};

/* ═══════════════════════════════════════════════════════════
   モックデータ
   ═══════════════════════════════════════════════════════════ */

// 日別件数: ARTICLES から動的に生成（グラフと記事一覧が同一データソース）


const _buildDailyAll = (articles) => {
  const byDate = {};
  articles.forEach(a => {
    if (!byDate[a.date]) byDate[a.date] = { news: 0, yt: 0, x: 0 };
    if (a.src === "youtube") byDate[a.date].yt++;
    else if (a.src === "x") byDate[a.date].x++;
    else byDate[a.date].news++;
  });
  // (uses module-level _parseDate)
  // 歯抜けの日を0件で埋める
  const dates = Object.keys(byDate);
  if (dates.length >= 2) {
    const sorted = dates.sort((a, b) => _parseDate(a) - _parseDate(b));
    const toMD = (m, d) => `${m}/${d}`;
    const first = sorted[0].split("/").map(Number);
    const last = sorted[sorted.length - 1].split("/").map(Number);
    let [cm, cd] = first;
    const daysInMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    while (cm * 100 + cd <= last[0] * 100 + last[1]) {
      const key = toMD(cm, cd);
      if (!byDate[key]) byDate[key] = { news: 0, yt: 0, x: 0 };
      cd++;
      if (cd > daysInMonth[cm]) { cd = 1; cm++; }
    }
  }
  return Object.entries(byDate)
    .sort((a, b) => _parseDate(a[0]) - _parseDate(b[0]))
    .map(([date, counts]) => ({
      date, d: date,
      news: counts.news, yt: counts.yt, x: counts.x,
      total: counts.news + counts.yt + counts.x,
    }));
};
// DAILY_ALL: computed after ARTICLES definition (see below)

// ドメイン一覧（v2ズームイン用）— News のドメイン


const _buildChipTimeline = (articles) => {
  // (uses module-level _parseDate)
  // 日別に words を集計
  const byDate = {};
  articles.forEach(a => {
    if (!byDate[a.date]) byDate[a.date] = {};
    (a.words || []).forEach(w => {
      byDate[a.date][w] = (byDate[a.date][w] || 0) + 1;
    });
  });
  return Object.entries(byDate)
    .sort((a, b) => _parseDate(a[0]) - _parseDate(b[0]))
    .map(([date, wordMap]) => ({
      date,
      words: Object.entries(wordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([w, c]) => ({ w, c })),
    }))
    .filter(d => d.words.length > 0);
};
// CHIP_TIMELINE, CHIP_MAX_COUNT, CHIP_CONNECTED_WORDS: ARTICLES 定義後に初期化（後方参照回避）

// 記事リスト


const DOMAIN_MEDIA_TYPE = {
  // 新聞社
  "日本経済新聞": "newspaper", "読売新聞オンライン": "newspaper",
  "朝日新聞デジタル": "newspaper", "毎日新聞": "newspaper",
  "産経新聞": "newspaper", "中国新聞デジタル": "newspaper",
  "秋田魁新報電子版": "newspaper", "東京新聞": "newspaper",
  "北海道新聞": "newspaper", "神戸新聞": "newspaper",
  "西日本新聞": "newspaper", "河北新報": "newspaper",
  "共同通信": "wire", "時事通信": "wire", "時事ドットコム": "wire",
  // 放送局
  "日テレNEWS NNN": "broadcaster", "日テレNEWS": "broadcaster",
  "TBS NEWS DIG": "broadcaster", "テレ朝news": "broadcaster",
  "FNNプライムオンライン": "broadcaster", "NHK": "broadcaster",
  "CBC web": "broadcaster", "琉球朝日放送": "broadcaster",
  "テレビ朝日": "broadcaster",
  // 出版社
  "女性自身": "publisher", "モデルプレス": "publisher",
  "ダイヤモンド・オンライン": "publisher", "東洋経済オンライン": "publisher",
  "プレジデントオンライン": "publisher", "週刊文春": "publisher",
  "AERA dot.": "publisher",
  // Webメディア
  "ORICON NEWS": "webmedia", "J-CAST": "webmedia",
  "ENCOUNT": "webmedia", "ゴールドオンライン": "webmedia",
  "dメニューニュース": "webmedia", "ITmedia": "webmedia",
  "ねとらぼ": "webmedia",
};

const getMediaType = (domain) => DOMAIN_MEDIA_TYPE[domain] || "otherweb";



const filterByPeriod = (items, periodId, dateKey = "date") => {
  const days = parseInt(periodId);
  if (!days || !items.length) return items;
  // M/D → sortable int
  const allDates = [...new Set(items.map(a => a[dateKey]))].sort((a,b) => _parseDate(b) - _parseDate(a));
  const cutoff = new Set(allDates.slice(0, days));
  return items.filter(a => cutoff.has(a[dateKey]));
};




const SRC_TO_TYPE = { news: "web", youtube: "youtube", x: "twitter" };
const adaptArticle = (a) => {
  const type = a.type || SRC_TO_TYPE[a.src] || "web";
  return {
    ...a,
    pub: a.pub || a.domain || "",
    type,
    favicon: a.favicon || null,
    thumb: a.thumb || null,
    body: a.body || a.title || "",
    url: a.url || null,
    embedId: a.embedId || (type === "twitter" ? String(1000000000 + a.id) : null),
    embedUrl: a.embedUrl || (type === "youtube" ? `https://www.youtube.com/embed/mock_${a.id}` : null),
    repostCount: a.repostCount || 0,
    share: a.share || 0,
    views: a.src === "x" ? (a.score || 0) : (a.views || 0),
    play: a.play || 0,
    memo: a.memo || null,
    bookmarked: a.bookmarked || false,
  };
};

/* --- SplitArticleView: 左右分割 + スクロール連動の共通シェル --- */


const formatDateLabel = (mmdd) => {
  const [m, d] = mmdd.split("/").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), m - 1, d);
  // 未来日になったら前年と判定（年跨ぎ対応）
  if (target > today) target = new Date(now.getFullYear() - 1, m - 1, d);
  const diffDays = Math.round((today - target) / 86400000);
  const weekday = ["日","月","火","水","木","金","土"][target.getDay()];
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${m}/${d}（${weekday}）`;
};



const matchType = (articleType, filterType) => {
  if (filterType === "all") return true;
  if (filterType === "news") return articleType === "mass" || articleType === "web";
  if (filterType === "x") return articleType === "twitter";
  if (filterType === "other") return !["mass","web","youtube","twitter"].includes(articleType);
  return articleType === filterType;
};

/* ═══════════════════════════════════════════════════════════
   v8: 左右分割 + 連続詳細フィード（WatchModeV8）
   ─────────────────────────────────────────────────────────
   PC   ：左ペイン（スリム一覧）+ 右ペイン（連続詳細フィード）
   スマホ：ベース＝左、タップで右が前面化（B'案：左15%露出）
   廃止 ：DetailSheet / FreeLimitReached（→ TomorrowCard）
   ═══════════════════════════════════════════════════════════ */

/* --- Thumbnail with fallback (sandbox blocks external URLs) --- */


const scallopPath = (cx, cy, outerR, innerR, points) => {
  const d = [];
  for (let i = 0; i < points; i++) {
    const a1 = (i / points) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
    const a3 = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + outerR * Math.cos(a1), y1 = cy + outerR * Math.sin(a1);
    const xc = cx + innerR * Math.cos(a2), yc = cy + innerR * Math.sin(a2);
    const x2 = cx + outerR * Math.cos(a3), y2 = cy + outerR * Math.sin(a3);
    if (i === 0) d.push(`M${x1.toFixed(1)},${y1.toFixed(1)}`);
    d.push(`Q${xc.toFixed(1)},${yc.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }
  return d.join("") + "Z";
};
const getBadgeTier = (score) => {
  if (score == null || score <= 25) return 0;
  if (score <= 50) return 1;
  if (score <= 75) return 2;
  return 3;
};



const FREE_TYPE_LIMITS = { news: 4, twitter: 2, youtube: 2 };
const getTypeCat = (type) =>
  type === "twitter" ? "twitter" : type === "youtube" ? "youtube" : "news";

/* --- Upgrade Toast — non-blocking prompt for gated features --- */


const isNewArticle = (a, lastSeenDate) => _parseDate(a.date) > _parseDate(lastSeenDate);

/* --- useResizablePane: 左右分割ペインの共通フック --- */
const MIN_PANE = 400;
const useResizablePane = (storageKey = "caiwai-watch-split", defaultRatio = 0.55) => {
  const [ratio, setRatio] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) { const v = parseFloat(saved); if (v >= 0.3 && v <= 0.7) return v; }
    } catch {}
    return defaultRatio;
  });
  const dragging = useRef(false);
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const newRatio = Math.min(0.7, Math.max(0.3, x / rect.width));
      setRatio(newRatio);
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      cleanupRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    cleanupRef.current = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(storageKey, String(ratio)); } catch {}
  }, [ratio, storageKey]);

  const [layoutMode, setLayoutMode] = useState("both");
  const [effectiveRatio, setEffectiveRatio] = useState(ratio);
  const ratioRef = useRef(ratio);

  useEffect(() => {
    ratioRef.current = ratio;
    if (!containerRef.current) return;
    const w = containerRef.current.getBoundingClientRect().width;
    if (w < MIN_PANE * 2) { setEffectiveRatio(ratio); return; }
    const leftW = w * ratio;
    const rightW = w * (1 - ratio);
    if (leftW < MIN_PANE) { setEffectiveRatio(MIN_PANE / w); }
    else if (rightW < MIN_PANE) { setEffectiveRatio(1 - MIN_PANE / w); }
    else { setEffectiveRatio(ratio); }
  }, [ratio]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const r = ratioRef.current;
      if (w < MIN_PANE * 2) { setLayoutMode("left-only"); setEffectiveRatio(r); return; }
      const leftW = w * r;
      const rightW = w * (1 - r);
      if (leftW < MIN_PANE) { setEffectiveRatio(MIN_PANE / w); }
      else if (rightW < MIN_PANE) { setEffectiveRatio(1 - MIN_PANE / w); }
      else { setEffectiveRatio(r); }
      setLayoutMode("both");
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return { ratio: effectiveRatio, containerRef, onMouseDown, layoutMode };
};

export {
  _parseDate, shareViaUrl,
  WORD_COLORS, _WORD_COLOR_MAP, getWordColor,
  _buildDailyAll, _buildChipTimeline,
  DOMAIN_MEDIA_TYPE, getMediaType,
  filterByPeriod,
  SRC_TO_TYPE, adaptArticle,
  formatDateLabel, matchType,
  scallopPath, getBadgeTier,
  FREE_TYPE_LIMITS, getTypeCat,
  isNewArticle,
  useResizablePane,
};
