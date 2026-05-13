/**
 * useSheetData — Google Sheets CSV → アプリデータ 段階的ローディング
 *
 * L1: articles + highlights（最優先 — 画面表示に直結）
 * L2: detections + domains（分析モード用 — バックグラウンド）
 * L3: embeds（ビューポート進入時に個別ロード — XEmbed/YouTubeLite が担当）
 *
 * スプシ連携前は null を返し、dashboard.jsx 内蔵のモックデータを使う。
 * スプシ接続時は SPREADSHEET_ID を設定するだけで切り替わる。
 */
import { useState, useEffect, useCallback, useRef, startTransition } from "react";

/* ── 設定 ── */
// 「ファイル → 共有 → ウェブに公開」で生成された URL のベース部分
const PUBLISHED_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRm-oCMrh4lpUzTVMAawC9OrTfmMBHciN_GGh-egumz_m5-6WXfH1dJAmovGP0bWmKtEgPQLUxiTY_/pub";
const SHEET_NAMES = {
  articles: "articles",
  detections: "detections",
  highlights: "highlights",
  domains: "domains",
};
// シートの gid（スプレッドシートの各タブURL末尾の gid= の値）
const SHEET_GIDS = {
  articles:   "0",
  highlights: "87735352",
  detections: "873105986",
  domains:    "353230667",
};

/* ── CSV fetch URL ── */
const csvUrl = (sheetName) =>
  `${PUBLISHED_BASE_URL}?output=csv&gid=${SHEET_GIDS[sheetName]}`;

/* ── CSV パーサー（簡易版、引用符対応） ── */
const parseCsv = (text) => {
  const lines = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "\n" && !inQuote) {
      lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuote) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  if (lines.length < 2) return [];

  const splitRow = (line) => {
    const cols = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { cell += '"'; i++; }
        else q = !q;
      } else if (c === "," && !q) {
        cols.push(cell);
        cell = "";
      } else {
        cell += c;
      }
    }
    cols.push(cell);
    return cols;
  };

  const headers = splitRow(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitRow(line);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ""; });
    return obj;
  });
};

/* ── 型変換 ── */
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const toBool = (v) => v === "TRUE" || v === "true";

const parseArticle = (row) => ({
  id: toNum(row.id),
  title: row.title || "",
  src: row.src || "news",
  date: row.date || "",
  domain: row.domain || "",
  url: row.url || "",
  body: row.body || "",
  score: toNum(row.score),
  words: row.words ? row.words.split(",").map((w) => w.trim()).filter(Boolean) : [],
  thumb: row.thumb || "",
  favicon: row.favicon || "",
  views: toNum(row.views),
  play: toNum(row.play),
  share: toNum(row.share),
  repostCount: toNum(row.repostCount),
  toriatsukai: row.toriatsukai || "",
  clusterId: row.clusterId || "",
  embedId: row.embedId || "",
  embedUrl: row.embedUrl || "",
  memo: row.memo || "",
  bookmarked: toBool(row.bookmarked),
  mediaType: row.mediaType || "",
});

const parseDetection = (row) => ({
  id: row.id || "",
  type: row.type || "",
  viewpoint: row.viewpoint || "",
  strength: toNum(row.strength),
  params: (() => { try { return JSON.parse(row.params || "{}"); } catch { return {}; } })(),
  linkedDate: row.linkedDate || "",
  linkedWord: row.linkedWord || "",
  linkedSource: row.linkedSource || "",
});

// const parseHighlight = (row) => ({
//   date: row.date || "",
//   segments: (() => { try { return JSON.parse(row.segments || "[]"); } catch { return []; } })(),
//   collapsed: row.collapsed || "",
// });
import parseHighlightText from "./parseHighlight";

const parseHighlight = (row) => ({
  date: row.date || "",
  segments: parseHighlightText(row.segments || ""),
  collapsed: row.collapsed || "",
});

const parseDomain = (row) => ({
  domain: row.domain || "",
  count: toNum(row.count),
  firstSeen: row.firstSeen || "",
  rare: toBool(row.rare),
});

/* ── ローディング状態 ── */
const STAGES = { IDLE: "idle", L1: "l1", L2: "l2", DONE: "done", ERROR: "error" };

/* ── メインフック ── */
export default function useSheetData() {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [data, setData] = useState({
    articles: null,
    highlights: null,
    detections: null,
    domains: null,
  });
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const abortRef = useRef(null);

  const fetchSheet = useCallback(async (sheetName, signal) => {
    const res = await fetch(csvUrl(sheetName), { signal });
    if (!res.ok) throw new Error(`${sheetName}: HTTP ${res.status}`);
    return parseCsv(await res.text());
  }, []);

  useEffect(() => {
    // スプシ未設定 → モックデータモード
    if (!PUBLISHED_BASE_URL) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        // ── L1: articles + highlights ──
        setStage(STAGES.L1);
        const [rawArticles, rawHighlights] = await Promise.all([
          fetchSheet(SHEET_NAMES.articles, ctrl.signal),
          fetchSheet(SHEET_NAMES.highlights, ctrl.signal),
        ]);

        startTransition(() => {
          setData((prev) => ({
            ...prev,
            articles: rawArticles.map(parseArticle),
            highlights: rawHighlights.map(parseHighlight),
          }));
        });

        // ── L2: detections + domains ──
        setStage(STAGES.L2);
        const [rawDetections, rawDomains] = await Promise.allSettled([
          fetchSheet(SHEET_NAMES.detections, ctrl.signal),
          fetchSheet(SHEET_NAMES.domains, ctrl.signal),
        ]);

        startTransition(() => {
          setData((prev) => ({
            ...prev,
            detections: rawDetections.status === "fulfilled"
              ? rawDetections.value.map(parseDetection) : [],
            domains: rawDomains.status === "fulfilled"
              ? rawDomains.value.map(parseDomain) : null,
          }));
          setStage(STAGES.DONE);
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setStage(STAGES.ERROR);
        }
      }
    })();

    return () => ctrl.abort();
  }, [fetchSheet, fetchKey]);

  // リトライ
  const retry = useCallback(() => {
    setError(null);
    setData({ articles: null, highlights: null, detections: null, domains: null });
    setFetchKey((k) => k + 1);
  }, []);

  return {
    /** null = モックデータモード（スプシ未接続） */
    articles: data.articles,
    highlights: data.highlights,
    detections: data.detections,
    domains: data.domains,
    /** "idle" | "l1" | "l2" | "done" | "error" */
    stage,
    error,
    retry,
    /** true = スプシ接続済み */
    isConnected: !!PUBLISHED_BASE_URL,
  };
}
