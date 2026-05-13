import { useState, useMemo, useRef, useEffect } from "react";
import {
  Bookmark, BookmarkCheck, ExternalLink, ChevronDown, ChevronLeft,
  Sparkles, Zap, Activity, Eye, Copy, ArrowRight,
  Flame, Sprout, Mountain, Sunset, Tag, BarChart3, Map
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { T, font } from "../tokens";
import {
  _parseDate, adaptArticle, getWordColor, filterByPeriod,
  DOMAIN_MEDIA_TYPE, getMediaType, shareViaUrl, useResizablePane, _buildDailyAll,
} from "../utils";
import {
  ARTICLES, DAILY_ALL, DOMAIN_DATA, DATA_DATE_RANGE,
  CHIP_TIMELINE, CHIP_MAX_COUNT, CHIP_CONNECTED_WORDS,
  DETECTIONS, DETECTION_TEMPLATES, getDetectionsForView,
  TORIATSUKAI_DEFAULT, MAX_PANE,
} from "../mockData";
import { SegmentControl } from "./Filters";
import { SplitArticleView } from "./SplitPane";
import { WatchInsightBar, SlimCard, DetailCard } from "./WatchMode";

const AnalysisDrillList = ({ articles, title, highlightWord, onBookmark }) => {
  const adapted = useMemo(() => articles.map(adaptArticle), [articles]);
  const ids = useMemo(() => adapted.map(a => a.id), [adapted]);

  if (adapted.length === 0) {
    return (
      <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 12, color: T.ink40 }}>
        該当する記事がありません
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.ink40, padding: "8px 4px 4px" }}>
        {title}（{articles.length}件）
      </div>
      <SplitArticleView
        articleIds={ids}
        storageKey="caiwai-analysis-split"
        defaultRatio={0.45}
        height="calc(100vh - 380px)"
        renderLeft={({ slimRefs, currentId, onSlimClick }) => (
          <>
            {adapted.map(a => (
              <div key={a.id} ref={el => { if (el) slimRefs.current[a.id] = el; else delete slimRefs.current[a.id]; }}>
                <SlimCard
                  article={a}
                  isCurrent={currentId === a.id}
                  onClick={(e) => onSlimClick(a.id, e.currentTarget)}
                />
              </div>
            ))}
          </>
        )}
        renderRight={({ detailRefs }) => (
          <>
            {adapted.map(a => (
              <div key={a.id}
                ref={el => { if (el) detailRefs.current[a.id] = el; else delete detailRefs.current[a.id]; }}
                data-article-id={a.id}>
                <DetailCard
                  article={a}
                  onBookmark={() => onBookmark && onBookmark(a.id)}
                  onShare={(art) => shareViaUrl({
                    title: art.title || "caiwai 記事",
                    text: `${art.pub} / ${art.date}`,
                    urlSuffix: `?article=${art.id}`,
                  })}
                />
              </div>
            ))}
          </>
        )}
      />
    </div>
  );
};

// レコメンドリンク（他視点への遷移）


const RecommendLinks = ({ currentVp, linkedDate, linkedWord, linkedSource, onNavigate }) => {
  const targets = ["qty","v5"].filter(v => v !== currentVp);
  const vpNames = { qty: "定量", v5: "定性" };
  const vpIcons = { qty: BarChart3, v5: Map };
  const context = linkedDate || linkedWord || linkedSource;
  if (!context) return null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "10px 0",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: "flex", alignItems: "center", gap: 4 }}>
        <Sparkles size={9} />
        {linkedDate && `${linkedDate} を別の視点で`}
        {linkedWord && `「${linkedWord}」を別の視点で`}
        {linkedSource && `${linkedSource} を別の視点で`}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {targets.map(vpId => {
          const Icon = vpIcons[vpId];
          return (
            <button key={vpId}
              onClick={() => onNavigate(vpId, { date: linkedDate, word: linkedWord, source: linkedSource })}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: T.rSm,
                background: T.card, border: `1px solid ${T.accentBorder}`,
                color: T.ink80, fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all .15s",
              }}>
              <Icon size={11} style={{ color: T.accent }} />
              {vpNames[vpId]}
              <ArrowRight size={10} style={{ color: T.ink40 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 共起語ラベル群（定量ビューで使用、因果語なし）


const CooccurrenceLabels = ({ date, onTapWord }) => {
  const dayData = CHIP_TIMELINE.find(d => d.date === date);
  if (!dayData) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "4px 0" }}>
      {dayData.words.slice(0, 5).map(({ w, c }) => (
        <button key={w} onClick={() => onTapWord && onTapWord(w)} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 999,
          background: `${getWordColor(w)}11`, border: `1px solid ${getWordColor(w)}33`,
          cursor: "pointer", fontSize: 11, fontWeight: 600,
          color: getWordColor(w),
        }}>
          {w} <span style={{ fontWeight: 400, fontSize: 11 }}>{c}</span>
        </button>
      ))}
    </div>
  );
};



/* ═══════════════════════════════════════════════════════════
   定量ビュー
   総合: 積み上げ棒（ソースフィルタで単色棒に切替）→ ドメイン別ドリル
   ═══════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════
   定量ビュー
   総合: 積み上げ棒（ソースフィルタで単色棒に切替）→ ドメイン別ドリル
   ═══════════════════════════════════════════════════════════ */

const ViewQuantity = ({ filter, onNavigate, sourceFilter, period = "14d", newsSubType = "all-news", onBookmark, toriatsukaiFilter = TORIATSUKAI_DEFAULT }) => {
  // period は親から props で受け取る
  const [selectedDate, setSelectedDate] = useState(filter?.date || null);
  const [selectedWord, setSelectedWord] = useState(filter?.word || null);
  // ドメインパネル（開閉式・props の sourceFilter に連動）
  const [domainOpen, setDomainOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  // ソースタイプ切替時にドメイン関連 state を reset
  // 初回マウント時はスキップ（依存配列の意図と挙動を一致させる）
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    setDomainOpen(false);
    setSelectedDomain(null);
  }, [sourceFilter]);

  // 期間＋ソース＋ニュースサブでフィルタしたデータを動的に構築
  const periodArticles = useMemo(() => {
    let arts = filterByPeriod(ARTICLES, period);
    if (sourceFilter !== "all") {
      arts = arts.filter(a =>
        sourceFilter === "news" ? a.src === "news" :
        sourceFilter === "youtube" ? a.src === "youtube" :
        sourceFilter === "other" ? !["news","youtube","x"].includes(a.src) :
        a.src === "x"
      );
    }
    if (sourceFilter === "news" && newsSubType !== "all-news") {
      arts = arts.filter(a => getMediaType(a.domain) === newsSubType);
    }
    // 取扱いフィルタ
    arts = arts.filter(a => toriatsukaiFilter[a.toriatsukai] !== false);
    return arts;
  }, [period, sourceFilter, newsSubType, toriatsukaiFilter]);

  const data = useMemo(() => _buildDailyAll(periodArticles), [periodArticles]);

  // 記事フィルタ（日付・ワード・ドメインでさらに絞り込み）
  let filteredArticles = periodArticles;
  if (selectedDate) filteredArticles = filteredArticles.filter(a => a.date === selectedDate);
  if (selectedWord) filteredArticles = filteredArticles.filter(a => a.words.includes(selectedWord));
  if (selectedDomain) filteredArticles = filteredArticles.filter(a => a.domain === selectedDomain);

  const handleBarClick = (entry) => {
    if (entry && entry.activePayload) {
      const d = entry.activePayload[0]?.payload?.date || entry.activePayload[0]?.payload?.d;
      if (d) {
        setSelectedDate(prev => prev === d ? null : d);
        setSelectedWord(null);
      }
    }
  };

  // ドメインパネル開閉
  const toggleDomains = () => {
    setDomainOpen(prev => !prev);
    setSelectedDomain(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* チャート＋ハイライト: 広幅で横並び、狭幅で縦積み */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ flex: "7 1 500px", minWidth: 0, maxWidth: 700 }}>
      {/* ドメインボタン（ソース絞り込み時のみ） */}
      {sourceFilter !== "all" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={toggleDomains} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "5px 10px", borderRadius: T.rSm,
            border: `1px solid ${domainOpen ? T.accent : T.accentBorder}`,
            background: domainOpen ? `${T.accent}15` : T.accentSoft,
            fontWeight: 600, fontSize: 11, cursor: "pointer",
            color: T.accent, transition: "all .12s", whiteSpace: "nowrap",
          }}>
            ドメイン {domainOpen ? "▴" : "▾"}
          </button>
        </div>
      )}

          {/* グラフ: 総合=積み上げ、単独ソース=単色棒 */}
          <div className="v10-chart-wrap" style={{ width: "100%", height: 220, position: "sticky", top: 88, /* コントロールバー(52) + padding(8*2) + gap(12) + 余裕(8) */ zIndex: 7, background: T.card, overflow: "visible", borderBottom: `1px solid ${T.ink08}`, paddingBottom: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} onClick={handleBarClick}
                margin={{ top: 16, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.ink08} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: T.ink40 }} axisLine={false} tickLine={false}
                  interval={3} />
                <YAxis tick={{ fontSize: 9, fill: T.ink40 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, padding: 6, borderRadius: 8 }} cursor={{ fill: "rgba(99,102,241,.04)" }} />
                <Bar dataKey="news" stackId={sourceFilter === "all" ? "s" : undefined}
                  fill={T.news} radius={[0,0,0,0]} hide={sourceFilter !== "all" && sourceFilter !== "news"}>
                  {data.map((d, i) => (
                    <Cell key={i} opacity={selectedDate && selectedDate !== d.date ? 0.2 : 0.7} />
                  ))}
                </Bar>
                <Bar dataKey="yt" stackId={sourceFilter === "all" ? "s" : undefined}
                  fill={T.youtube} radius={[0,0,0,0]} hide={sourceFilter !== "all" && sourceFilter !== "youtube"}>
                  {data.map((d, i) => (
                    <Cell key={i} opacity={selectedDate && selectedDate !== d.date ? 0.2 : 0.7} />
                  ))}
                </Bar>
                <Bar dataKey="x" stackId={sourceFilter === "all" ? "s" : undefined}
                  fill={T.xColor} radius={[3,3,0,0]} hide={sourceFilter !== "all" && sourceFilter !== "x"}>
                  {data.map((d, i) => (
                    <Cell key={i} opacity={selectedDate && selectedDate !== d.date ? 0.2 : 0.7} />
                  ))}
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ドメインパネル（開閉式） */}
          {domainOpen && sourceFilter !== "all" && (
            <div style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: "10px 12px", borderRadius: T.rMd,
              background: T.card, border: `1px solid ${T.ink08}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.ink60 }}>
                {sourceFilter === "news" ? "News" : sourceFilter === "youtube" ? "YouTube" : "X"} のドメイン
              </div>
              {(sourceFilter === "news" ? DOMAIN_DATA : []).map((d, i) => {
                const widthPct = DOMAIN_DATA.length > 0 ? (d.count / DOMAIN_DATA[0].count) * 100 : 0;
                const isSelected = selectedDomain === d.domain;
                return (
                  <button key={i} onClick={() => setSelectedDomain(prev => prev === d.domain ? null : d.domain)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 8px", borderRadius: T.rSm,
                      background: isSelected ? T.accentSoft : "transparent",
                      border: `1px solid ${isSelected ? T.accentBorder : "transparent"}`,
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "all .15s",
                    }}>
                    <span style={{
                      fontSize: 11, fontWeight: d.rare ? 700 : 500, color: T.ink80,
                      minWidth: 120, display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {d.domain}
                      {d.rare && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4,
                          background: T.tideSoft, color: T.tide, fontWeight: 700,
                          display: "inline-flex", alignItems: "center", gap: 2,
                        }}><Zap size={8} />{d.rareLabel}</span>
                      )}
                      {!d.rare && d.rareLabel === "2回目" && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4,
                          background: T.ink04, color: T.ink40, fontWeight: 600,
                        }}>{d.rareLabel}</span>
                      )}
                    </span>
                    <div style={{ flex: 1, height: 8, background: T.ink04, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${widthPct}%`, height: "100%",
                        background: d.rare ? T.tide : T.news, opacity: d.rare ? 0.85 : 0.5,
                        borderRadius: 4, transition: "width .3s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: T.ink60, minWidth: 24, textAlign: "right", fontWeight: 600 }}>{d.count}</span>
                  </button>
                );
              })}
              {sourceFilter !== "news" && (
                <div style={{ padding: 12, textAlign: "center", color: T.ink40, fontSize: 12 }}>
                  （モック: News のドメインのみ表示）
                </div>
              )}
            </div>
          )}

      </div>
      <div style={{ flex: "6 1 calc(50% - 8px)", minWidth: 280, maxWidth: 600 }}>
        <WatchInsightBar onArticleTap={() => {}} alwaysExpanded />
      </div>
      </div>

          {/* 記事一覧（Watch コンポーネント再利用） */}
          <AnalysisDrillList
            articles={filteredArticles}
            title={selectedDomain ? `${selectedDomain} の記事` : selectedDate ? `${selectedDate}${selectedWord ? ` × ${selectedWord}` : ""} の記事` : "直近の記事"}
            highlightWord={selectedWord}
            onBookmark={onBookmark}
          />

          {/* 共起語ラベル */}
          {selectedDate && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.ink40, marginBottom: 4 }}>
                  {selectedDate} の共起語
                </div>
                <CooccurrenceLabels date={selectedDate} onTapWord={(w) => setSelectedWord(prev => prev === w ? null : w)} />
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 999, fontSize: 11,
                  background: T.accentSoft, border: `1px solid ${T.accentBorder}`, color: T.accent,
                }}>
                  {selectedDate}
                  <button onClick={() => { setSelectedDate(null); setSelectedWord(null); }}
                    style={{ border:"none", background:"none", cursor:"pointer", color: T.accent, padding: 0, fontSize: 11 }}>×</button>
                </span>
                {selectedWord && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 8px", borderRadius: 999, fontSize: 11,
                    background: `${getWordColor(selectedWord)}11`, border: `1px solid ${getWordColor(selectedWord)}33`,
                    color: getWordColor(selectedWord),
                  }}>
                    {selectedWord}
                    <button onClick={() => setSelectedWord(null)}
                      style={{ border:"none", background:"none", cursor:"pointer", color: getWordColor(selectedWord), padding: 0, fontSize: 11 }}>×</button>
                  </span>
                )}
              </div>
            </div>
          )}



      {/* レコメンドリンク（定性マップへの遷移） */}
      {(selectedDate || selectedWord) && (
        <RecommendLinks currentVp="qty"
          linkedDate={selectedDate} linkedWord={selectedWord}
          onNavigate={onNavigate} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   v5 定性マップ
   色固定チップタイムライン（日別7語固定）
   チップサイズ=件数、同じ語=同じ色で追跡
   ═══════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════
   v5 定性マップ
   色固定チップタイムライン（日別7語固定）
   チップサイズ=件数、同じ語=同じ色で追跡
   ═══════════════════════════════════════════════════════════ */

const ViewV5 = ({ filter, onNavigate, period = "14d", onBookmark, toriatsukaiFilter = TORIATSUKAI_DEFAULT }) => {
  const [selectedChip, setSelectedChip] = useState(
    filter?.word ? { date: filter.date || null, word: filter.word } : null
  );
  // 期間でフィルタした定性マップ
  const periodChips = useMemo(() => filterByPeriod(CHIP_TIMELINE, period), [period]);

  // 選択チップの記事フィルタ（取扱いフィルタ適用）
  let filteredArticles = filterByPeriod(ARTICLES, period).filter(a => toriatsukaiFilter[a.toriatsukai] !== false);
  if (selectedChip) {
    if (selectedChip.date) filteredArticles = filteredArticles.filter(a => a.date === selectedChip.date);
    if (selectedChip.word) filteredArticles = filteredArticles.filter(a => a.words.includes(selectedChip.word));
  }

  const handleChipTap = (date, word) => {
    setSelectedChip(prev => {
      if (prev && prev.date === date && prev.word === word) return null;
      return { date, word };
    });
  };


  // --- サンキー的接続線 ---
  const timelineRef = useRef(null);
  const [connLines, setConnLines] = useState([]);



  // DOM測定 → 接続線の座標を算出
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const containerRect = el.getBoundingClientRect();
      // 各日×語のチップ中心座標を収集
      const positions = {}; // { word: [{ date, cx, cy }] }
      el.querySelectorAll("[data-chip-word]").forEach(chip => {
        const w = chip.getAttribute("data-chip-word");
        const d = chip.getAttribute("data-chip-date");
        if (!CHIP_CONNECTED_WORDS.has(w)) return;
        const r = chip.getBoundingClientRect();
        const cx = r.left + r.width / 2 - containerRect.left;
        const cy = r.top + r.height / 2 - containerRect.top;
        if (!positions[w]) positions[w] = [];
        const chipCount = parseInt(chip.getAttribute("data-chip-count")) || 0;
        positions[w].push({ date: d, cx, cy, count: chipCount });
      });
      // 隣接日ペアの線を生成
      const lines = [];
      Object.entries(positions).forEach(([w, pts]) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const midY = (a.cy + b.cy) / 2;
          const avgC = (a.count + b.count) / 2;
          const wRatio = Math.sqrt(avgC / CHIP_MAX_COUNT);
          lines.push({
            word: w,
            color: getWordColor(w),
            d: `M${a.cx},${a.cy} C${a.cx},${midY} ${b.cx},${midY} ${b.cx},${b.cy}`,
            width: 1.5 + wRatio * 6,
          });
        }
      });
      setConnLines(lines);
    }, 80); // レンダー後に測定
    return () => clearTimeout(timer);
  }, [selectedChip, periodChips]);


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 凡例（出現した全語の色） */}
      <div style={{
        display: "flex", gap: 4, flexWrap: "wrap", padding: "4px 0",
        borderBottom: `1px solid ${T.ink08}`, paddingBottom: 8,
      }}>
        {[...CHIP_CONNECTED_WORDS].slice(0, 12).map(w => (
          <span key={w} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600,
            color: getWordColor(w), background: `${getWordColor(w)}11`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: getWordColor(w) }} />
            {w}
          </span>
        ))}
      </div>

      {/* チップタイムライン */}
      <div ref={timelineRef} style={{
        display: "flex", flexDirection: "column", gap: 2,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        overflow: "visible", position: "relative",
      }}>
        {periodChips.map((day) => {
          const isHighlightDay = selectedChip?.date === day.date;
          const hasSpike = day.date === "5/1";
          return (
            <div key={day.date} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 6px", borderRadius: T.rSm,
              background: isHighlightDay ? T.accentSoft : "transparent",
              border: isHighlightDay ? `1px solid ${T.accentBorder}` : `1px solid transparent`,
              transition: "all .15s",
              minHeight: 32,
              position: "relative",
              overflow: "visible",
              zIndex: 2,
            }}>
              {/* 日付ラベル */}
              <span style={{
                fontSize: 11, fontWeight: 700, color: hasSpike ? T.tide : T.ink40,
                minWidth: 32, textAlign: "right", flexShrink: 0,
                display: "flex", alignItems: "center", gap: 2,
              }}>
                {day.date}
              </span>

              {/* チップ群 */}
              <div style={{ display: "flex", gap: 3, flexWrap: "nowrap", flex: 1, alignItems: "center", overflow: "hidden" }}>
                {day.words.map(({ w, c }) => {
                  const isSelected = selectedChip?.date === day.date && selectedChip?.word === w;
                  const isWordHighlight = selectedChip?.word === w && !selectedChip?.date;
                  const color = getWordColor(w);
                  // サイズスケーリング: 件数に応じて fontSize / padding / height を変化
                  const ratio = Math.sqrt(c / CHIP_MAX_COUNT); // 平方根スケール（グローバル基準）
                  const sz = {
                    fontSize: Math.round(9 + ratio * 5),      // 9〜14px
                    padY: Math.round(2 + ratio * 4),           // 2〜6px
                    padX: Math.round(5 + ratio * 7),           // 5〜12px
                    height: Math.round(20 + ratio * 12),       // 20〜32px
                    countSize: Math.round(7 + ratio * 3),      // 7〜10px
                  };
                  return (
                    <button key={w} data-chip-word={w} data-chip-date={day.date} data-chip-count={c}
                      onClick={() => handleChipTap(day.date, w)} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      gap: 3,
                      padding: `${sz.padY}px ${sz.padX}px`,
                      borderRadius: 999,
                      height: sz.height,
                      background: isSelected ? color : "rgba(255,255,255,.65)",
                      color: isSelected ? "#fff" : color,
                      border: isSelected ? `2px solid ${color}` : `1.5px solid ${color}66`,
                      fontSize: sz.fontSize, fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .12s",
                      opacity: selectedChip && !isSelected && !isWordHighlight ? 0.4 : 1,
                    }}>
                      {w}
                      <span style={{ fontSize: sz.countSize, fontWeight: 400 }}>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* サンキー的接続線 SVG overlay */}
        {connLines.length > 0 && (
          <svg style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            pointerEvents: "none", zIndex: 1,
          }}>
            {connLines.map((line, i) => (
              <path key={i} d={line.d}
                stroke={line.color} strokeWidth={line.width} fill="none"
                strokeOpacity={selectedChip?.word === line.word ? 0.5 : 0.2}
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </div>

      {/* 記事一覧（Watch コンポーネント再利用） */}
      <AnalysisDrillList
        articles={filteredArticles}
        title={selectedChip ? `${selectedChip.date || "全期間"} × ${selectedChip.word || ""}` : "直近の記事"}
        highlightWord={selectedChip?.word}
        onBookmark={onBookmark}
      />

      {/* レコメンドリンク */}
      {selectedChip && (
        <RecommendLinks currentVp="v5"
          linkedDate={selectedChip.date} linkedWord={selectedChip.word}
          onNavigate={onNavigate} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HEADER — 統一ヘッダー（全モード共通・1行）
   ブランドバー: caiwAi + カテゴリ名 + プラン + モード切替セグメント + 通知/設定/ヘルプ
   モード別コントロールは各モード内に配置（Header下段は廃止）
   ═══════════════════════════════════════════════════════════ */
export { SplitArticleView, AnalysisDrillList, RecommendLinks, CooccurrenceLabels, ViewQuantity, ViewV5 };
