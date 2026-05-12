import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { T, font } from "../tokens";
import { SOURCES, NEWS_SUB_SOURCES, TORIATSUKAI_OPTIONS } from "../mockData";

const SourcePills = ({ active, onChange, toriatsukaiFilter, onToriatsukaiChange }) => {
  const [toriOpen, setToriOpen] = useState(false);
  const toriRef = useRef(null);
  useEffect(() => {
    if (!toriOpen) return;
    const h = (e) => { if (toriRef.current && !toriRef.current.contains(e.target)) setToriOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [toriOpen]);
  const toriModified = toriatsukaiFilter && (
    !toriatsukaiFilter["タイトル"] || !toriatsukaiFilter["冒頭"] || toriatsukaiFilter["本文内"]
  );
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {SOURCES.map(src => {
        if (src.id === "toriatsukai") {
          return (
            <div key={src.id} ref={toriRef} style={{ position: "relative" }}>
              <button onClick={() => setToriOpen(p => !p)} style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "4px 8px", borderRadius: T.rPill,
                border: `1px solid ${toriOpen || toriModified ? T.ink20 : T.ink08}`,
                background: toriOpen ? T.ink04 : "transparent",
                color: toriModified ? T.ink80 : T.ink40,
                fontSize: 11, fontWeight: 500,
                cursor: "pointer", transition: "all .15s",
              }}>
                <SlidersHorizontal size={11} />
                {src.label}
                {toriModified && <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: T.mid, marginLeft: 1,
                }} />}
              </button>
              {toriOpen && toriatsukaiFilter && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: T.card, borderRadius: T.r,
                  border: `1px solid ${T.border}`, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                  padding: "8px 10px", zIndex: 100,
                  display: "flex", flexDirection: "column", gap: 6,
                  minWidth: 140,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.ink40, letterSpacing: "0.04em" }}>取扱い</span>
                  {TORIATSUKAI_OPTIONS.map(opt => {
                    const isOn = toriatsukaiFilter[opt.id];
                    return (
                      <button key={opt.id}
                        onClick={() => onToriatsukaiChange({ ...toriatsukaiFilter, [opt.id]: !isOn })}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 6px", borderRadius: 4,
                          border: "none", background: isOn ? T.mid + "0C" : "transparent",
                          color: isOn ? T.ink80 : T.ink40,
                          fontSize: 12, fontWeight: isOn ? 600 : 400,
                          cursor: "pointer", transition: "all .12s",
                          textAlign: "left", width: "100%",
                        }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: 3,
                          border: `1.5px solid ${isOn ? T.mid : T.ink20}`,
                          background: isOn ? T.mid : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all .12s",
                        }}>
                          {isOn && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>&#x2713;</span>}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        const isActive = active === src.id;
        const Icon = src.icon;
        return (
          <button key={src.id} onClick={() => onChange(src.id)} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: T.rPill,
            border: `1px solid ${isActive ? src.color + "30" : T.ink08}`,
            background: isActive ? src.color + "08" : "transparent",
            color: isActive ? src.color : T.ink40,
            fontSize: 12, fontWeight: isActive ? 700 : 500,
            cursor: "pointer",
            transition: "all .15s",
          }}>
            {Icon && <Icon size={11} />}
            {src.label}
          </button>
        );
      })}
    </div>
  );
};

/* ─── ニュース子階層 ─── */


const NewsSubPills = ({ active, onChange }) => (
  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
    {NEWS_SUB_SOURCES.map(s => {
      const isActive = active === s.id;
      return (
        <button key={s.id} onClick={() => onChange(s.id)} style={{
          padding: "4px 10px", borderRadius: T.rPill,
          border: `1px solid ${isActive ? T.news + "40" : T.ink08}`,
          background: isActive ? T.news + "0C" : T.ink04,
          color: isActive ? T.news : T.ink60,
          fontSize: 12, fontWeight: isActive ? 700 : 500,
          cursor: "pointer", transition: "all .15s",
        }}>{s.label}</button>
      );
    })}
  </div>
);

/* ─── 取扱いフィルタ（マルチセレクト ON/OFF） ─── */


const SegmentControl = ({ options, value, onChange, style = {} }) => (
  <div style={{
    display: "flex", gap: 2, overflowX: "auto", WebkitOverflowScrolling: "touch",
    padding: "2px", background: T.ink04, borderRadius: T.rSm, ...style,
  }}>
    {options.map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)} style={{
        padding: "5px 12px", borderRadius: "6px", border: "none",
        background: value === opt.id ? T.card : "transparent",
        color: value === opt.id ? T.ink80 : T.ink40,
        fontSize: 12, fontWeight: value === opt.id ? 700 : 500,
        cursor: "pointer", whiteSpace: "nowrap",
        boxShadow: value === opt.id ? "0 1px 3px rgba(0,0,0,.06)" : "none",
        transition: "all .15s",
      }}>{opt.label}</button>
    ))}
  </div>
);

export { SourcePills, NewsSubPills, SegmentControl };
