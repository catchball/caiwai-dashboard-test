import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bookmark, BookmarkCheck, ExternalLink, X,
  ChevronDown, Sparkles, Zap, RefreshCw,
  Flame, Sprout, Mountain, Sunset,
  Newspaper, Youtube, Twitter,
  List, FileText, Clock, Share2, Copy, Eye, Brain, Tag
} from "lucide-react";
import { T, font } from "../tokens";
import {
  _parseDate, shareViaUrl, getWordColor, formatDateLabel,
  scallopPath, getBadgeTier, FREE_TYPE_LIMITS, getTypeCat,
  isNewArticle, matchType, adaptArticle, filterByPeriod,
  useResizablePane, getMediaType,
} from "../utils";
import {
  ARTICLES, INITIAL_ARTICLES, LAST_SEEN_DATE,
  HIGHLIGHT_SEGMENTS, HIGHLIGHT_COLLAPSED, HIGHLIGHT_DATE,
  MIN_PANE, MAX_PANE, TRENDS, MATURITY_META, FAVICON_COLORS,
  CHIP_TIMELINE, CHIP_CONNECTED_WORDS, TORIATSUKAI_DEFAULT,
  DATA_DATE_RANGE, DETECTIONS, getDetectionsForView
} from "../mockData";
import { SourcePills, NewsSubPills } from "./Filters";
import { SplitArticleView } from "./SplitPane";

// useResizablePane は ../utils からimport済み




const Chip = ({ children, color = T.ink40, bg = T.ink08, onClick }) => (
  <span onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    height: 18, padding: "0 7px", borderRadius: T.rPill,
    fontSize: 11, fontWeight: 700, letterSpacing: ".03em",
    color, background: bg,
    ...(onClick ? { cursor: "pointer" } : {}),
  }}>{children}</span>
);


/* ═══════════════════════════════════════════════════════════
   トレンドデータ + Maturity 関連（ReportMode 依存）
   ═══════════════════════════════════════════════════════════ */


const MaturityBadge = ({ stage, showLabel = true }) => {
  const m = MATURITY_META[stage];
  const Icon = m.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      height: 20, padding: "0 8px", borderRadius: T.rPill,
      fontSize: 11, fontWeight: 800, letterSpacing: ".03em",
      color: m.color, background: m.bg, border: `1px solid ${m.color}15`,
    }}>
      <Icon size={10} />{showLabel && m.desc}
    </span>
  );
};





const Favicon = ({ pub, type, faviconUrl, score }) => {
  const [imgErr, setImgErr] = useState(false);
  const color = FAVICON_COLORS[type] || FAVICON_COLORS.web;
  const letter = (pub || "?").replace(/^[@＠]/, "").charAt(0) || "?";
  const tier = getBadgeTier(score);
  const hasBadge = tier > 0;
  const boxSize = hasBadge ? 22 : 16;
  const pad = hasBadge ? 3 : 0;

  const inner = (faviconUrl && !imgErr) ? (
    <img src={faviconUrl} alt="" onError={() => setImgErr(true)}
      style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain",
        ...(hasBadge ? { position: "absolute", top: pad, left: pad } : {}) }} />
  ) : (
    <div style={{ width: 16, height: 16, borderRadius: 4, background: color,
      display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1,
      ...(hasBadge ? { position: "absolute", top: pad, left: pad } : {}) }}>
      {letter}
    </div>
  );

  if (!hasBadge) return <div style={{ flexShrink: 0, width: 16, height: 16 }}>{inner}</div>;

  const c = boxSize / 2;
  let badge;
  if (tier === 1) {
    badge = <path d={scallopPath(c, c, 10, 9, 4)} fill="none" stroke={T.ink} strokeWidth={1.2} opacity={0.25} />;
  } else if (tier === 2) {
    badge = <path d={scallopPath(c, c, 10.5, 8.5, 6)} fill="none" stroke={T.ink} strokeWidth={1.8} opacity={0.45} />;
  } else {
    badge = <path d={scallopPath(c, c, 10.5, 7.5, 10)} fill="none" stroke={T.ink} strokeWidth={2.2} opacity={0.7} />;
  }

  return (
    <div style={{ position: "relative", width: boxSize, height: boxSize, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${boxSize} ${boxSize}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {badge}
      </svg>
      {inner}
    </div>
  );
};





/* --- All Caught Up — minimal + entrance animation --- */


const AllCaughtUp = ({ onShare }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 12, padding: "24px 0 20px",
    animation: "gentleIn .4s ease",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <CheckCircle2 size={16} style={{ color: T.high }} />
      <span style={{ fontSize: 14, color: T.ink40 }}>
        すべてチェック済み
      </span>
    </div>
    {/* B2: ピーク・エンドの法則 — 終わりの瞬間に機会導線 */}
    {onShare && (
      <button
        onClick={onShare}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 999,
          border: `1px solid ${T.accentBorder}`,
          background: T.accentSoft,
          color: T.accent,
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          transition: "all .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,.10)"}
        onMouseLeave={e => e.currentTarget.style.background = T.accentSoft}
      >
        <Share2 size={13} />
        今日の整理を業界仲間と共有
      </button>
    )}
  </div>
);

/* --- Free tier: per-day per-type limits --- */


const UpgradeToast = ({ message, onDismiss }) => (
  <div style={{
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 300,
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px 10px 14px",
    borderRadius: T.rMd,
    background: T.navy, color: "#fff",
    boxShadow: "0 4px 24px rgba(12,18,34,.3)",
    animation: "sheetUp .25s cubic-bezier(.22,1,.36,1)",
    fontSize: 13, fontWeight: 500,
  }}>
    <Sparkles size={14} style={{ color: T.aiLabel, flexShrink: 0 }} />
    <span style={{ opacity: .85 }}>{message}</span>
    <button onClick={onDismiss} style={{
      marginLeft: 4, padding: "4px 10px", borderRadius: T.rPill,
      border: `1px solid rgba(255,255,255,.15)`, background: "rgba(255,255,255,.08)",
      color: T.aiLabel, fontSize: 12, fontWeight: 700, cursor: "pointer",
      whiteSpace: "nowrap",
    }}>
      詳しく
    </button>
  </div>
);

/* --- Date Separator --- */


const DateSeparator = ({ date, isFirst, isNew }) => {
  const label = formatDateLabel(date);
  const isToday = label === "今日";
  return (
    <div style={{
      padding: isFirst ? "8px 0 6px" : "18px 0 6px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{
        fontSize: isToday ? 17 : 15,
        fontWeight: isNew ? 800 : 500,
        color: isToday ? T.ink : isNew ? T.ink80 : T.ink20,
        letterSpacing: "-.01em",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: isNew ? T.ink08 : T.ink04 }} />
    </div>
  );
};



/* --- ハイライト（帯）— 一覧モード上部、折りたたみ可 --- */
/* 雑誌の帯: 今日の記事群の全体像を、編集眼のある2〜4文で伝える              */
/* 代表記事リンク: テキスト内の固有名詞をタップ → 右ペインの該当記事へ       */
const WatchInsightBar = ({ onNavigateAnalysis, onArticleTap, alwaysExpanded = false, maxWidth }) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (alwaysExpanded) return false;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });
  return (
    <div
      onClick={alwaysExpanded ? undefined : () => setCollapsed(!collapsed)}
      style={{
        position: "relative",
        padding: collapsed ? "10px 16px" : "14px 18px",
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.rMd, boxShadow: T.shadow, cursor: alwaysExpanded ? "default" : "pointer",
        transition: "all .2s ease",
        margin: "0 0 4px",
        ...(maxWidth ? { maxWidth } : {}),
      }}
    >
      {/* 左上コーナーバッジ: アイコン + 日付 */}
      <div style={{
        position: "absolute", top: -1, left: -1,
        display: "inline-flex", alignItems: "center", gap: 6,
        background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
        padding: "3px 10px 3px 7px",
        borderRadius: `${T.rMd} 0 8px 0`,
        fontSize: 11, fontWeight: 700, color: "#fff",
        lineHeight: 1,
      }}>
        <Sparkles size={11} color="#fff" />
        <span>{HIGHLIGHT_DATE}</span>
      </div>
      <div style={{ paddingTop: collapsed ? 14 : 16 }}>
        {collapsed ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink80, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: T.ink }}>{HIGHLIGHT_COLLAPSED}</span>
          </div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 500, color: T.ink80, lineHeight: 1.7, ...(alwaysExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }) }}>
            {HIGHLIGHT_SEGMENTS.map((seg, i) => {
              if (typeof seg === "string") return <span key={i}>{seg}</span>;
              return (
                <span key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (seg.ids?.length && onArticleTap) onArticleTap(seg.ids[0]);
                  }}
                  style={{
                    fontWeight: 700, color: T.accent, cursor: "pointer",
                    borderBottom: `1px dotted ${T.accent}55`,
                    transition: "border-color .15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = T.accent}
                  onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = `${T.accent}55`}
                >{seg.t}</span>
              );
            })}
          </div>
        )}
      </div>
      {!alwaysExpanded && <ChevronDown size={14} style={{
        position: "absolute", top: 10, right: 12,
        color: T.ink20,
        transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform .2s ease",
      }} />}
    </div>
  );
};

/* --- Watch Mode Main --- */
/* Unified date groups: date desc > cluster (sum DRS desc) > DRS desc within cluster
   New/seen derived from lastSeenAt (date-level comparison, not per-article)
   Free: per-day per-type cap (FREE_TYPE_LIMITS), bookmark gated */

/* タイプフィルタ: Headerのタイプ切替に連動 */


/* ═══════════════════════════════════════════════════════════
   v8: 左右分割 + 連続詳細フィード（WatchModeV8）
   ─────────────────────────────────────────────────────────
   PC   ：左ペイン（スリム一覧）+ 右ペイン（連続詳細フィード）
   スマホ：ベース＝左、タップで右が前面化（B'案：左15%露出）
   廃止 ：DetailSheet / FreeLimitReached（→ TomorrowCard）
   ═══════════════════════════════════════════════════════════ */

/* --- Thumbnail with fallback (sandbox blocks external URLs) --- */
const Thumbnail = ({ src, type, size = 48 }) => {
  const [err, setErr] = useState(false);
  const fbColor = FAVICON_COLORS[type] || FAVICON_COLORS.web;
  const iconMap = { mass: Newspaper, web: Newspaper, youtube: Youtube, twitter: Twitter };
  const FallbackIcon = iconMap[type] || Newspaper;
  if (src && !err) {
    return (
      <img src={src} alt="" onError={() => setErr(true)} style={{
        width: size, height: size, borderRadius: 6, objectFit: "cover", opacity: 0.85,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: `${fbColor}10`, display: "grid", placeItems: "center", opacity: 0.85,
    }}>
      <FallbackIcon size={Math.round(size * 0.38)} style={{ color: `${fbColor}70` }} />
    </div>
  );
};

/* --- SlimCard（左ペイン用：タイトル+ソース+日付） --- */


const SlimCard = ({ article, isNew, isCurrent, onClick }) => {
  const tier = getBadgeTier(article.score);
  return (
    <div
      onClick={(e) => onClick && onClick(e)}
      className="slim-card"
      style={{
        padding: "8px 16px 8px 13px",
        marginLeft: -16, marginRight: -16,
        borderLeft: `3px solid ${isCurrent ? T.accent : "transparent"}`,
        background: isCurrent ? "rgba(99,102,241,.05)" : "transparent",
        cursor: "pointer",
        borderBottom: `1px solid ${T.ink08}`,
        transition: "background .12s, border-color .12s",
        display: "flex", alignItems: "flex-start", gap: 8,
      }}
    >
      {/* left: text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Favicon pub={article.pub} type={article.type} faviconUrl={article.favicon} score={article.score} />
          <span style={{
            fontSize: 13, color: tier >= 3 ? T.ink : tier >= 2 ? T.ink60 : T.ink40, fontWeight: tier >= 3 ? 700 : tier >= 2 ? 600 : 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1, minWidth: 0,
          }}>
            {article.pub}
          </span>
        </div>
        <div style={{
          fontSize: 15, fontWeight: 500,
          color: T.ink, lineHeight: 1.45,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {article.title}
        </div>
      </div>

      {/* right: thumbnail */}
      <div style={{ flexShrink: 0 }}>
        <Thumbnail src={article.thumb} type={article.type} size={36} />
      </div>
    </div>
  );
};

/* --- DetailCard（右ペイン用：リッチ展開、連続フィード形式） --- */
/* ─── OGP サムネイル（DetailCard から抽出） ─── */


const OgpThumb = ({ src, pub, hasBody }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div style={{
      width: "100%", height: 120,
      borderRadius: 8, background: T.ink04,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: hasBody ? 8 : 0,
      border: `1px solid ${T.ink08}`,
    }}>
      <span style={{ fontSize: 13, color: T.ink20, fontWeight: 600 }}>{pub}</span>
    </div>
  );
  return (
    <div style={{
      width: "100%", paddingBottom: "52%", position: "relative",
      borderRadius: 8, overflow: "hidden", background: T.ink04,
      marginBottom: hasBody ? 8 : 0,
    }}>
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%", objectFit: "cover",
        }}
      />
    </div>
  );
};



const DetailCard = ({ article, isNew, onBookmark, onShare }) => {
  const TypeIcon = article.type === "youtube" ? Youtube
    : article.type === "twitter" ? Twitter : Newspaper;
  const typeColor = article.type === "youtube" ? T.youtube
    : article.type === "twitter" ? T.xColor : T.news;
  const tier = getBadgeTier(article.score);
  return (
    <article className="detail-card" style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: T.rSm,
      padding: "16px 20px 14px",
      marginBottom: 6,
    }}>
      {/* meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Favicon pub={article.pub} type={article.type} faviconUrl={article.favicon} score={article.score} />
        <span style={{ fontSize: 12, fontWeight: tier >= 3 ? 700 : tier >= 2 ? 600 : 500, color: tier >= 3 ? T.ink : tier >= 2 ? T.ink60 : T.ink40 }}>{article.pub}</span>
        <TypeIcon size={11} style={{ color: typeColor, opacity: .7 }} />
        <span style={{ fontSize: 11, color: T.ink40 }}>{formatDateLabel(article.date)}</span>

        <span style={{ flex: 1 }} />
        {(() => {
          const spread = (article.repostCount || 0) + (article.share || 0) + (article.views || 0) + (article.play || 0);
          if (spread === 0) return null;
          const sc = spread >= 30 ? T.high : spread >= 10 ? T.mid : T.ink40;
          return <span style={{ fontSize: 11, fontWeight: 600, color: sc }}>+{spread}</span>;
        })()}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <button onClick={() => onShare && onShare(article)} title="リンクをコピー" style={{
            display: "grid", placeItems: "center",
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: "transparent",
            color: T.ink60, cursor: "pointer",
            transition: "all .15s",
            padding: 0,
          }}>
            <Copy size={15} />
          </button>
          <button onClick={onBookmark} title={article.bookmarked ? "メモ / 保存解除" : "保存"} style={{
            display: "grid", placeItems: "center",
            width: 36, height: 36, borderRadius: "50%",
            border: "none",
            background: article.bookmarked ? T.mid + "10" : "transparent",
            color: article.bookmarked ? T.mid : T.ink60,
            cursor: "pointer",
            transition: "all .15s",
            padding: 0,
          }}>
            {article.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>

      {/* title — Twitter は本文＝タイトル相当のため非表示 */}
      {article.type !== "twitter" && (
        <h3 style={{
          margin: "0 0 10px",
          fontSize: 16, fontWeight: 700, lineHeight: 1.5,
          letterSpacing: "-.01em",
        }}>
          {article.url ? (
            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
              color: T.ink, textDecoration: "none",
            }}>
              {article.title}
              <ExternalLink size={11} style={{ display: "inline", marginLeft: 5, opacity: 0.25, verticalAlign: "middle" }} />
            </a>
          ) : article.title}
        </h3>
      )}

      {/* memo（タイトル直下 — 未保存カードのみアクセントバーで表示。保存済はアクション内で表示） */}
      {article.memo && !article.bookmarked && (
        <div style={{
          marginBottom: 10, padding: "7px 12px 7px 10px",
          background: T.mid + "08",
          borderLeft: `3px solid ${T.mid}`,
          borderRadius: "0 6px 6px 0",
          display: "flex", alignItems: "flex-start", gap: 6,
        }}>
          <FileText size={12} style={{ color: T.mid, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: T.ink80, lineHeight: 1.5 }}>{article.memo}</span>
        </div>
      )}

      {/* embed: YouTube — サムネイル+再生ボタン（iframe はサンドボックスでブロックされるため） */}
      {article.type === "youtube" && article.embedUrl && (() => {
        const vidMatch = article.embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const vidId = vidMatch ? vidMatch[1] : null;
        const thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : null;
        return thumbUrl ? (
          <div
            onClick={() => window.open(`https://www.youtube.com/watch?v=${vidId}`, "_blank")}
            style={{
              position: "relative", width: "100%", paddingBottom: "50%",
              borderRadius: 8, overflow: "hidden", background: "#000",
              marginBottom: 10, cursor: "pointer",
            }}>
            <img src={thumbUrl} alt={article.title} loading="lazy" style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", objectFit: "cover",
            }} />
            {/* 再生ボタンオーバーレイ */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 56, height: 40, borderRadius: 8,
              background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center",
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "16px solid #fff",
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                marginLeft: 3,
              }} />
            </div>
          </div>
        ) : null;
      })()}

      {/* embed: X (Twitter) — 公式 widget は外部 JS 必要のため、X 風カードで模擬埋め込み */}
      {article.type === "twitter" && (
        <div style={{
          marginBottom: 12, padding: "14px 16px",
          background: "#fff", borderRadius: 14,
          border: `1px solid ${T.ink08}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: T.ink08, display: "grid", placeItems: "center",
              fontSize: 16, fontWeight: 800, color: T.ink40, flexShrink: 0,
            }}>
              {article.pub.replace(/^[@＠]/, "").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
                {article.pub.replace(/^[@＠]/, "")}
              </div>
              <div style={{ fontSize: 12, color: T.ink40, lineHeight: 1.2 }}>
                {article.pub.startsWith("@") ? article.pub : `@${article.pub}`}
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.ink, lineHeight: 1, marginTop: -2 }}>𝕏</div>
          </div>
          {article.body && (
            <div style={{
              fontSize: 15, color: T.ink, lineHeight: 1.55,
              marginBottom: article.thumb ? 10 : 8, whiteSpace: "pre-wrap",
            }}>
              {article.body}
            </div>
          )}
          {article.thumb && (
            <img
              src={article.thumb.replace("w=120&h=120", "w=600&h=400")}
              alt=""
              style={{
                width: "100%", borderRadius: 12,
                maxHeight: 240, objectFit: "cover",
                border: `1px solid ${T.ink08}`,
              }}
            />
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 18,
            marginTop: 10, fontSize: 12, color: T.ink40,
          }}>
            {article.views != null && <span>{article.views.toLocaleString()} 件の表示</span>}
            {article.repostCount > 0 && <span>{article.repostCount} 件の引用</span>}
          </div>
        </div>
      )}

      {/* article preview: mass/web — サムネ上・本文下レイアウト */}
      {(article.type === "mass" || article.type === "web") && (
        <div style={{ marginBottom: 8 }}>
          {article.thumb && <OgpThumb src={article.thumb} pub={article.pub} hasBody={!!article.body} />}
          {article.body && (
            <p style={{
              fontSize: 14, color: T.ink60, lineHeight: 1.65,
              margin: 0,
              display: "-webkit-box", WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {article.body}
            </p>
          )}
        </div>
      )}



      {/* 保存済 → インラインメモエリア（コンテンツ末尾） */}
      {article.bookmarked && (
        <div style={{
          marginTop: 8, padding: "8px 12px",
          background: T.mid + "06", borderRadius: T.rSm,
          border: `1px solid ${T.mid}20`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FileText size={13} style={{ color: T.mid, flexShrink: 0, opacity: 0.6 }} />
          {article.memo ? (
            <span style={{ fontSize: 13, color: T.ink80, lineHeight: 1.5, flex: 1 }}>{article.memo}</span>
          ) : (
            <span style={{ fontSize: 13, color: T.ink20, lineHeight: 1.5, flex: 1, fontStyle: "italic" }}>メモを追加…</span>
          )}
        </div>
      )}
    </article>
  );
};

/* --- TomorrowCard（Free 終端：明日また4件届く） --- */


const TomorrowCard = ({ compact = false }) => (
  <div style={{
    margin: compact ? "8px 0 24px" : "16px auto 28px",
    maxWidth: compact ? "none" : 580,
    padding: compact ? "20px 16px" : "32px 20px 28px",
    background: `linear-gradient(180deg, ${T.bg}, rgba(99,102,241,.04))`,
    borderRadius: T.rMd,
    border: `1px dashed ${T.aiLabelBorder}`,
    textAlign: "center",
    animation: "gentleIn .4s ease",
  }}>
    <div style={{ fontSize: compact ? 18 : 24, marginBottom: 6 }}>🌅</div>
    <div style={{
      fontSize: compact ? 12 : 14, fontWeight: 700, color: T.ink,
      marginBottom: 4, letterSpacing: "-.005em",
    }}>
      明日の朝、また 4 件届きます
    </div>
    <div style={{
      fontSize: 12, color: T.ink40, lineHeight: 1.6, marginBottom: 14,
    }}>
      Premium に切り替えると、続きを今すぐ読めます
    </div>
    <button style={{
      height: 34, padding: "0 18px", borderRadius: T.rPill, border: "none",
      background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
      color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
      boxShadow: "0 1px 6px rgba(99,102,241,.2)",
    }}>
      Premium で続きを読む
    </button>
  </div>
);



/* --- WatchModeV8 — 左右分割 + 連続詳細フィード（SplitArticleView 利用） --- */
const WatchModeV8 = ({ articles, setArticles, isPremium, activeType, setActiveType, unreadCount, onSetMode, newsSubType, setNewsSubType, toriatsukaiFilter, setToriatsukaiFilter, searchKeyword }) => {
  const [toast, setToast] = useState(null);

  /* === データロジック === */
  const dateGroups = useMemo(() => {
    let filtered = activeType === "all" ? articles : articles.filter(a => matchType(a.type, activeType));
    if (activeType === "news" && newsSubType !== "all-news") {
      filtered = filtered.filter(a => getMediaType(a.pub) === newsSubType);
    }
    // 取扱いフィルタ（OFF の取扱い種別を除外）
    filtered = filtered.filter(a => toriatsukaiFilter[a.toriatsukai] !== false);
    // キーワード絞り込み（title / body 部分一致）
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(a =>
        (a.title && a.title.toLowerCase().includes(kw)) ||
        (a.body && a.body.toLowerCase().includes(kw))
      );
    }
    const byDate = {};
    filtered.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    });
    const sortedDates = Object.keys(byDate).sort((a, b) => _parseDate(b) - _parseDate(a));
    return sortedDates.map(date => {
      const clusterMap = {};
      byDate[date].forEach(a => {
        const cid = a.clusterId || `_s_${a.id}`;
        if (!clusterMap[cid]) clusterMap[cid] = [];
        clusterMap[cid].push(a);
      });
      Object.values(clusterMap).forEach(g => g.sort((a, b) => b.score - a.score));
      const clusters = Object.values(clusterMap).sort((a, b) => {
        const sumA = a.reduce((s, x) => s + x.score, 0);
        const sumB = b.reduce((s, x) => s + x.score, 0);
        return sumB - sumA;
      });
      return { date, clusters, isNew: _parseDate(date) > _parseDate(LAST_SEEN_DATE) };
    });
  }, [articles, activeType, newsSubType, toriatsukaiFilter, searchKeyword]);

  const { visibleGroups, totalCount, freeCappedCount, blurPreviewArticles } = useMemo(() => {
    const allFlat = dateGroups.flatMap(g => g.clusters.flat());
    const total = allFlat.length;
    if (isPremium) {
      return { visibleGroups: dateGroups, totalCount: total, freeCappedCount: total, blurPreviewArticles: [] };
    }
    if (dateGroups.length === 0) {
      return { visibleGroups: [], totalCount: 0, freeCappedCount: 0, blurPreviewArticles: [] };
    }
    const latest = dateGroups[0];
    const visibleIds = new Set();
    const dayCounts = {};
    latest.clusters.forEach(cluster => {
      cluster.forEach(a => {
        const cat = getTypeCat(a.type);
        dayCounts[cat] = (dayCounts[cat] || 0) + 1;
        if (dayCounts[cat] <= (FREE_TYPE_LIMITS[cat] || 6)) {
          visibleIds.add(a.id);
        }
      });
    });
    const latestFiltered = {
      ...latest,
      clusters: latest.clusters
        .map(c => c.filter(a => visibleIds.has(a.id)))
        .filter(c => c.length > 0),
    };
    const groups = latestFiltered.clusters.length > 0 ? [latestFiltered] : [];
    const allArticlesOrdered = dateGroups.flatMap(g => g.clusters.flat());
    const hiddenArticles = allArticlesOrdered.filter(a => !visibleIds.has(a.id));
    const blurPreview = hiddenArticles.slice(0, 3);
    return { visibleGroups: groups, totalCount: total, freeCappedCount: visibleIds.size, blurPreviewArticles: blurPreview };
  }, [dateGroups, isPremium]);

  const orderedArticles = useMemo(
    () => visibleGroups.flatMap(g => g.clusters.flat()),
    [visibleGroups]
  );
  const allCaughtUp = isPremium && unreadCount === 0;
  const orderedIds = useMemo(() => orderedArticles.map(a => a.id), [orderedArticles]);

  const handleBookmark = (id) => {
    if (!isPremium) {
      setToast("ブックマーク — Premium で利用可能");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
  };

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 16px" }}>
        <WatchInsightBar onNavigateAnalysis={() => onSetMode("analysis")} onArticleTap={() => {}} maxWidth={600} alwaysExpanded />
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <SourcePills active={activeType} onChange={setActiveType} toriatsukaiFilter={toriatsukaiFilter} onToriatsukaiChange={setToriatsukaiFilter} />
            {activeType === "news" && (
              <NewsSubPills active={newsSubType} onChange={setNewsSubType} />
            )}
          </div>
        </div>
      </div>
      <SplitArticleView
        articleIds={orderedIds}
        height="calc(100vh - 80px)"
        storageKey="caiwai-watch-split"
        defaultRatio={0.55}
        containerStyle={{
          maxWidth: 1280, margin: "0 auto", boxSizing: "border-box",
          border: "none", borderRadius: 0, overflow: undefined,
          borderTop: "1px solid " + T.border,
        }}
        renderLeft={({ slimRefs, currentId, onSlimClick, showDetailMobile }) => (
          <>
            {visibleGroups.map(({ date, clusters, isNew }, gi) => (
              <div key={date}>
                <DateSeparator date={date} isFirst={gi === 0} isNew={isNew} />
                {clusters.flatMap(cluster =>
                  cluster.map((article) => (
                    <div key={article.id} ref={el => { if (el) slimRefs.current[article.id] = el; else delete slimRefs.current[article.id]; }}>
                      <SlimCard
                        article={article}
                        isNew={isNewArticle(article)}
                        isCurrent={currentId === article.id}
                        onClick={(e) => onSlimClick(article.id, e.currentTarget)}
                      />
                    </div>
                  ))
                )}
              </div>
            ))}
            {allCaughtUp && (
              <AllCaughtUp onShare={() => shareViaUrl({
                title: "今日の納豆 caiwai",
                text: "今日の整理を業界仲間と共有します（24時間限定）",
              })} />
            )}
            {/* blur preview: 「まだある」気配（Free時のみ） */}
            {!isPremium && !showDetailMobile && blurPreviewArticles.length > 0 && (
              <div style={{ position: "relative", overflow: "hidden", marginTop: 4 }}>
                <div style={{
                  filter: "blur(8px)", pointerEvents: "none", userSelect: "none", opacity: 0.7,
                }}>
                  {blurPreviewArticles.map(article => (
                    <SlimCard key={article.id} article={article} isNew={false} isCurrent={false} onClick={() => {}} />
                  ))}
                </div>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "70%",
                  background: `linear-gradient(transparent, ${T.card})`, pointerEvents: "none",
                }} />
              </div>
            )}
            {!isPremium && !showDetailMobile && <TomorrowCard compact />}
          </>
        )}
        renderRight={({ detailRefs }) => (
          <>
            {orderedArticles.map((article) => (
              <div
                key={article.id}
                ref={(el) => { if (el) detailRefs.current[article.id] = el; else delete detailRefs.current[article.id]; }}
                data-article-id={article.id}
              >
                <DetailCard
                  article={article}
                  isNew={isNewArticle(article)}
                  onBookmark={() => handleBookmark(article.id)}
                  onShare={(art) => shareViaUrl({
                    title: art.title || "caiwai 記事",
                    text: `${art.pub} / ${art.date}`,
                    urlSuffix: `?article=${art.id}`,
                  })}
                />
              </div>
            ))}
            {!isPremium && <TomorrowCard />}
            {isPremium && allCaughtUp && (
              <AllCaughtUp onShare={() => shareViaUrl({
                title: "今日の納豆 caiwai",
                text: "今日の整理を業界仲間と共有します（24時間限定）",
              })} />
            )}
          </>
        )}
      />
      {toast && <UpgradeToast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   レポートモード（ユーザー名: レポート）
   サマリー（ユーザー名: サマリー）+ メトリクス + 推奨アクション
   ═══════════════════════════════════════════════════════════ */


export {
  useResizablePane, Chip, MaturityBadge, Favicon,
  AllCaughtUp, UpgradeToast, DateSeparator,
  WatchInsightBar, Thumbnail, SlimCard, OgpThumb, DetailCard,
  TomorrowCard, WatchModeV8
};
