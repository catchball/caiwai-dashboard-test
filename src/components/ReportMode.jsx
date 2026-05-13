import { useState } from "react";
import {
  FileText, ChevronDown, Sparkles, ExternalLink,
  Share2, Clock, CheckCircle2, Zap, Brain, Activity, Tag, RefreshCw
} from "lucide-react";
import { T, font } from "../tokens";
import { TRENDS, MATURITY_META } from "../mockData";
import { Chip, MaturityBadge } from "./WatchMode";

/* ═══════════════════════════════════════════════════════════
   レポートモード（ユーザー名: レポート）
   サマリー（ユーザー名: サマリー）+ メトリクス + 推奨アクション
   ═══════════════════════════════════════════════════════════ */

const ReportMode = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.shadow, padding: "24px 26px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink40, letterSpacing: ".08em", marginBottom: 4 }}>WEEKLY REPORT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-.01em" }}>納豆 — メディア露出レポート</div>
          <div style={{ fontSize: 12, color: T.ink40, marginTop: 3 }}>2026年4月11日 – 4月17日</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{
            height: 32, padding: "0 14px", borderRadius: T.rSm,
            border: `1px solid ${T.ink20}`, background: "transparent",
            color: T.ink60, fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}><Share2 size={12} /> 共有</button>
          <button style={{
            height: 32, padding: "0 14px", borderRadius: T.rSm,
            border: `1px solid ${T.aiLabelBorder}`, background: T.aiLabelSoft,
            color: T.aiLabel, fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}><FileText size={12} /> PDF出力</button>
        </div>
      </div>
      {/* AI Summary */}
      <div style={{
        padding: "16px 18px",
        background: `linear-gradient(135deg, rgba(99,102,241,.03), rgba(99,102,241,.008))`,
        border: `1px solid ${T.aiLabelBorder}`, borderRadius: T.rMd, marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Zap size={12} style={{ color: T.aiLabel }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.aiLabel, letterSpacing: ".05em" }}>AI サマリー</span>
          <Chip color={T.ink40} bg={T.ink08}><Clock size={8} /> 自動生成</Chip>
        </div>
        <p style={{ fontSize: 13, color: T.ink80, lineHeight: 1.75, margin: 0 }}>
          今週の納豆関連メディア露出は<strong>247件</strong>（前週比+12%）。4月12日の日経新聞「市場過去最高」記事の後、Yahoo!ニュース経由で<strong>28件</strong>の転載を確認。YouTube領域では健康系チャンネルの検証動画が<strong>12.5万再生</strong>（Lv.72）を記録。X上では料理研究家まるみ氏の投稿が<strong>18万view</strong>でUGCカテゴリの最高値。<strong>健康志向</strong>の文脈での露出が全体の62%を占め、海外展開への言及も8件。
        </p>
      </div>
      {/* トレンドサマリー */}
      <div style={{
        padding: "14px 18px", background: T.ink04,
        border: `1px solid ${T.ink08}`, borderRadius: T.rMd,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Activity size={12} style={{ color: T.aiLabel }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.aiLabel, letterSpacing: ".05em" }}>検出トレンド</span>
          <Chip color={T.aiLabel} bg={T.aiLabelSoft}><Brain size={8} /> 自動分析</Chip>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TRENDS.map(trend => {
            const m = MATURITY_META[trend.maturity];
            return (
              <div key={trend.id} style={{
                flex: "1 1 180px", padding: "10px 14px", borderRadius: T.rSm,
                background: T.card, border: `1px solid ${T.ink08}`, borderLeft: `3px solid ${m.color}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.ink80 }}>{trend.topic}</span>
                  <MaturityBadge stage={trend.maturity} showLabel={false} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.ink60 }}>{trend.articles}件</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: trend.velocity.startsWith("+") ? T.up : trend.velocity.startsWith("-") ? T.down : T.ink40 }}>{trend.velocity}</span>
                </div>
                <p style={{ fontSize: 12, color: T.ink40, lineHeight: 1.5, margin: "4px 0 0" }}>{trend.consumerAngle.slice(0, 40)}…</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Pages */}
    <div style={{ display: "flex", gap: 10 }}>
      {[
        { p: "P.1", t: "サマリー", d: "KPI + トレンド概況 + 主要トピック" },
        { p: "P.2", t: "トレンド分析", d: "成熟度マップ + シグナル + 消費者インサイト" },
        { p: "P.3", t: "メディア詳細", d: "マス / ウェブ TOP5 + AIタグ分布" },
        { p: "P.4", t: "UGC詳細", d: "YouTube / X TOP5 + Lv.分布" },
      ].map((pg, i) => (
        <div key={i} style={{
          flex: "1 1 0", background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.rMd, boxShadow: T.shadow, padding: "14px 16px",
          cursor: "pointer", transition: "all .15s ease",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.accentBorder}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: T.aiLabel, letterSpacing: ".06em", marginBottom: 5 }}>{pg.p}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink80, marginBottom: 2 }}>{pg.t}</div>
          <div style={{ fontSize: 12, color: T.ink40, lineHeight: 1.4 }}>{pg.d}</div>
        </div>
      ))}
    </div>

    {/* Value props */}
    <div style={{ display: "flex", gap: 10 }}>
      {[
        { icon: Activity, color: T.emerging, bg: T.emergingSoft, title: "トレンド発見", desc: "記事群から新出トピックを自動検出。成熟度ライフサイクルで「今どこにいるか」を可視化し、次の動きを先読みする。" },
        { icon: Brain, color: T.aiLabel, bg: T.aiLabelSoft, title: "消費者インサイト", desc: "メディア露出の裏にある消費者心理を推定。「なぜ話題になっているか」を構造化し、マーケティング施策の起点に。" },
        { icon: Tag, color: T.high, bg: T.highSoft, title: "AI自動タギング", desc: "全記事に自動タグ付与。人手では追いきれない大量記事を構造化し、トレンドの見落としを防ぐ。" },
        { icon: RefreshCw, color: T.mid, bg: T.midSoft, title: "フィードバック学習", desc: "ノイズ報告・ブックマークの蓄積で分析精度が向上。使い込むほどカスタマイズされた体験に。" },
      ].map((v, i) => (
        <div key={i} style={{
          flex: "1 1 0", background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.r, boxShadow: T.shadow, padding: "18px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: v.bg, display: "grid", placeItems: "center" }}>
              <v.icon size={12} style={{ color: v.color }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.ink80 }}>{v.title}</span>
          </div>
          <p style={{ fontSize: 12, color: T.ink60, lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   ▼ ▼ ▼  以下：招待UIコンポーネント群（v7-bundled で同梱）
   元ファイル: caiwai_invite_components_v1.jsx
   ═══════════════════════════════════════════════════════════ */

export { ReportMode };
