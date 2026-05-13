import { useState, useCallback } from "react";
import {
  X, Copy, CheckCircle2, Send, ArrowRight,
  Mail, UserPlus, Settings, ExternalLink, Share2, Bell
} from "lucide-react";
import { T, font } from "../tokens";
import { shareViaUrl } from "../utils";
import { INVITE_TEMPLATES } from "../mockData";

const ModalBackdrop = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(12,18,34,.55)",
    display: "grid", placeItems: "center",
    padding: 16,
    animation: "fadeIn .2s ease",
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      width: "100%", maxWidth: 480,
      maxHeight: "calc(100vh - 32px)",
      overflow: "auto",
      background: "#fff", borderRadius: 14,
      boxShadow: "0 12px 48px rgba(12,18,34,.25)",
      animation: "sheetUp .25s cubic-bezier(.22,1,.36,1)",
    }}>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   1. InviteFormModal — 招待フォーム
   コピー集 §5.2
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   1. InviteFormModal — 招待フォーム
   コピー集 §5.2
   ═══════════════════════════════════════════════════════════ */
const InviteFormModal = ({ userId = "shin0001", onClose, onSent }) => {
  const [email, setEmail] = useState("");
  const [tplId, setTplId] = useState("formal");
  const [body, setBody] = useState(INVITE_TEMPLATES[0].body);
  const [copied, setCopied] = useState(false);
  const inviteUrl = `https://caiwai.app/?ref=${userId}`;

  const onTplChange = (id) => {
    const t = INVITE_TEMPLATES.find(x => x.id === id) || INVITE_TEMPLATES[0];
    setTplId(id);
    setBody(t.body);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard not available */ }
  };

  const onSubmit = () => {
    if (!email) return;
    onSent?.(email);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{
        padding: "18px 22px", borderBottom: `1px solid ${T.ink08}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
          業界の方を caiwai にご招待
        </span>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 6, border: "none",
          background: "transparent", cursor: "pointer", color: T.ink40,
          display: "grid", placeItems: "center",
        }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {/* メアド入力 */}
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink40, marginBottom: 6 }}>
          招待先のメールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@company.co.jp"
          style={{
            width: "100%", height: 38, padding: "0 12px",
            borderRadius: T.rSm, border: `1px solid ${T.ink08}`,
            fontSize: 13, color: T.ink,
            outline: "none", marginBottom: 14,
            boxSizing: "border-box",
          }}
        />

        {/* AI 招待文ラベル＋トーン選択 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.ink40, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={11} style={{ color: T.accent }} />
            AI が招待文を書きます
          </span>
          <select
            value={tplId}
            onChange={(e) => onTplChange(e.target.value)}
            style={{
              fontSize: 12, padding: "3px 6px",
              borderRadius: 6, border: `1px solid ${T.ink08}`,
              background: "#fff", color: T.ink, cursor: "pointer",
            }}
          >
            {INVITE_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          style={{
            width: "100%", padding: "10px 12px",
            borderRadius: T.rSm, border: `1px solid ${T.ink08}`,
            fontSize: 12, color: T.ink, lineHeight: 1.6,
            outline: "none", resize: "vertical", marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        {/* 送信／キャンセル */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            onClick={onSubmit}
            disabled={!email}
            style={{
              flex: 1, height: 40, borderRadius: T.rPill, border: "none",
              background: email ? `linear-gradient(135deg, ${T.accent}, #818cf8)` : T.ink08,
              color: email ? "#fff" : T.ink40,
              fontSize: 13, fontWeight: 700,
              cursor: email ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: email ? "0 2px 12px rgba(99,102,241,.25)" : "none",
            }}
          >
            <Send size={13} /> 招待を送信
          </button>
          <button onClick={onClose} style={{
            padding: "0 18px", height: 40, borderRadius: T.rPill,
            border: `1px solid ${T.ink08}`, background: "#fff",
            color: T.ink40, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            キャンセル
          </button>
        </div>

        {/* URL 直接コピー */}
        <div style={{
          padding: "12px 14px",
          background: T.bg, borderRadius: T.rMd,
          border: `1px solid ${T.ink08}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink40, marginBottom: 6 }}>
            または、招待 URL を直接コピー
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{
              flex: 1, fontSize: 12, color: T.ink, padding: "6px 10px",
              background: "#fff", borderRadius: 6, border: `1px solid ${T.ink08}`,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "ui-monospace, monospace",
            }}>{inviteUrl}</code>
            <button onClick={onCopy} style={{
              height: 30, padding: "0 12px", borderRadius: 6,
              border: `1px solid ${T.ink08}`, background: "#fff",
              color: copied ? T.accent : T.ink40, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
            }}>
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};

/* ═══════════════════════════════════════════════════════════
   2. InviteSuccessModal — 招待送信完了
   コピー集 §5.3
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   2. InviteSuccessModal — 招待送信完了
   コピー集 §5.3
   ═══════════════════════════════════════════════════════════ */
const InviteSuccessModal = ({ recipientEmail = "", totalSent = 0, onSendAnother, onClose }) => (
  <ModalBackdrop onClose={onClose}>
    <div style={{ padding: 28, textAlign: "center" }}>
      <CheckCircle2 size={28} style={{ color: T.accent, marginBottom: 10 }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
        招待を送信しました
      </div>
      <div style={{ fontSize: 12, color: T.ink40, marginBottom: 20 }}>
        {recipientEmail
          ? <><span style={{ color: T.ink80 }}>{recipientEmail}</span> 宛にメールを送りました。</>
          : "招待メールを送信しました。"}
      </div>

      <div style={{
        padding: "16px 20px",
        background: T.accentSoft, border: `1px solid ${T.accentBorder}`,
        borderRadius: T.rMd, marginBottom: 18,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>
          もう一人送りますか？
        </div>
        <div style={{ fontSize: 12, color: T.ink40, marginBottom: 12 }}>
          caiwai は招待をお気軽にどうぞ。
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onSendAnother} style={{
            height: 36, padding: "0 18px", borderRadius: T.rPill, border: "none",
            background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <UserPlus size={12} /> もう一人送る
          </button>
          <button onClick={onClose} style={{
            height: 36, padding: "0 18px", borderRadius: T.rPill,
            border: `1px solid ${T.ink08}`, background: "#fff",
            color: T.ink40, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            完了
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.ink40 }}>
        これまでにあなたが招待した方：
        <span style={{ color: T.ink80, fontWeight: 700 }}>{totalSent}名</span>
      </div>
    </div>
  </ModalBackdrop>
);

/* ═══════════════════════════════════════════════════════════
   3. SettingsModal — 設定（招待実績・URL）
   コピー集 §5.5
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   3. SettingsModal — 設定（招待実績・URL）
   コピー集 §5.5
   ═══════════════════════════════════════════════════════════ */
const SettingsModal = ({ inviteCount = 0, userId = "shin0001", onClose, onInvite }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `https://caiwai.app/?ref=${userId}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard not available */ }
  };

  const milestones = [
    { count: 1, label: "1名招待で 表示量 6/3/3" },
    { count: 3, label: "3名招待で 表示量 8/4/4（最大）" },
    { count: 5, label: "5名招待で caiwai アンバサダー認定" },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{
        padding: "18px 22px", borderBottom: `1px solid ${T.ink08}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 14, fontWeight: 700, color: T.ink,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Settings size={14} style={{ color: T.ink40 }} /> 設定
        </span>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 6, border: "none",
          background: "transparent", cursor: "pointer", color: T.ink40,
          display: "grid", placeItems: "center",
        }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: T.ink40,
          letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10,
        }}>
          招待実績
        </div>

        <div style={{
          padding: "16px 18px", background: T.bg,
          borderRadius: T.rMd, border: `1px solid ${T.ink08}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, color: T.ink40, marginBottom: 4 }}>
            これまでにあなたが招待した方
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginBottom: 14 }}>
            {inviteCount}
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink40, marginLeft: 4 }}>名</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {milestones.map(m => {
              const reached = inviteCount >= m.count;
              return (
                <div key={m.count} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, color: reached ? T.ink80 : T.ink40,
                }}>
                  <CheckCircle2 size={12} style={{
                    color: reached ? T.accent : T.ink08, flexShrink: 0,
                  }} />
                  <span>{m.label}</span>
                  {reached && m.count < 5 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: T.accent,
                      marginLeft: "auto", letterSpacing: ".04em",
                    }}>達成済</span>
                  )}
                </div>
              );
            })}
          </div>

          {inviteCount >= 3 && inviteCount < 5 && (
            <div style={{
              fontSize: 12, color: T.ink40, marginTop: 12,
              paddingTop: 10, borderTop: `1px solid ${T.ink08}`, lineHeight: 1.6,
            }}>
              5名到達時、catchball から個別にご案内いたします。
            </div>
          )}
        </div>

        <div style={{
          fontSize: 12, fontWeight: 700, color: T.ink40,
          letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8,
        }}>
          あなたの招待 URL
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <code style={{
            flex: 1, fontSize: 12, color: T.ink, padding: "8px 12px",
            background: T.bg, borderRadius: T.rSm, border: `1px solid ${T.ink08}`,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontFamily: "ui-monospace, monospace",
          }}>{inviteUrl}</code>
          <button onClick={onCopy} style={{
            height: 32, padding: "0 12px", borderRadius: T.rSm,
            border: `1px solid ${T.ink08}`, background: "#fff",
            color: copied ? T.accent : T.ink40, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          }}>
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? "コピー済み" : "コピー"}
          </button>
        </div>

        <button onClick={onInvite} style={{
          width: "100%", height: 40, borderRadius: T.rPill,
          border: "none", background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 2px 12px rgba(99,102,241,.25)",
        }}>
          <Mail size={13} /> 招待を送る
        </button>
      </div>
    </ModalBackdrop>
  );
};

/* ═══════════════════════════════════════════════════════════
   4. SignupCompleteScreen — サインアップ完了
   コピー集 §3.1
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   4. SignupCompleteScreen — サインアップ完了
   コピー集 §3.1
   ═══════════════════════════════════════════════════════════ */
const SignupCompleteScreen = ({
  magazineName = "納豆", referrerName = "山田太郎",
  referrerCompany = "ABC食品",
  totalReferrals = 12,
  onPrimary, onPreview, onSkip,
}) => (
  <ModalBackdrop onClose={onSkip}>
    <div style={{ padding: 28 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
          ようこそ、日刊{magazineName}caiwai へ。
        </div>
        <div style={{ fontSize: 12, color: T.ink40, lineHeight: 1.7 }}>
          {referrerCompany}の{referrerName}さんからの紹介でご登録いただきました。<br />
          明日朝、最初のメルマガが届きます。
        </div>
      </div>

      <div style={{
        padding: "16px 18px", marginBottom: 18,
        background: T.accentSoft, border: `1px solid ${T.accentBorder}`,
        borderRadius: T.rMd,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
          🎁 あなたも業界の方を招待できます
        </div>
        <div style={{ fontSize: 12, color: T.ink40, lineHeight: 1.7, marginBottom: 10 }}>
          caiwai は招待をお気軽に。業界の知人にぜひお知らせください。
        </div>
        <div style={{ fontSize: 12, color: T.ink80, lineHeight: 1.7 }}>
          ・1名招待で 6/3/3<br />
          ・3名招待で 8/4/4（最大）
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onPrimary} style={{
          height: 44, borderRadius: T.rPill, border: "none",
          background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 2px 12px rgba(99,102,241,.25)",
        }}>
          <Mail size={14} /> 業界の方に送る
        </button>
        <button onClick={onPreview} style={{
          height: 38, borderRadius: T.rPill,
          border: `1px solid ${T.ink08}`, background: "#fff",
          color: T.ink, fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Eye size={12} /> 招待プレビューを送る
        </button>
        <button onClick={onSkip} style={{
          height: 38, border: "none", background: "transparent",
          color: T.ink40, fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>
          今は見送る
        </button>
      </div>

      <div style={{
        textAlign: "center", marginTop: 18, paddingTop: 14,
        borderTop: `1px solid ${T.ink08}`,
        fontSize: 12, color: T.ink40,
      }}>
        {referrerName}さんから、これまでに
        <span style={{ color: T.ink80, fontWeight: 700 }}>{totalReferrals}人</span>
        が caiwai の購読を始めています。
      </div>
    </div>
  </ModalBackdrop>
);

/* ═══════════════════════════════════════════════════════════
   5. AllCaughtUpToast — 全件スキャン完了後の招待トースト
   コピー集 §5.6 / v2 ロードマップ §7.5
   ═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   5. AllCaughtUpToast — 全件スキャン完了後の招待トースト
   コピー集 §5.6 / v2 ロードマップ §7.5
   ═══════════════════════════════════════════════════════════ */
const AllCaughtUpToast = ({ onInvite, onDismiss }) => (
  <div style={{
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 250,
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px",
    borderRadius: T.rMd,
    background: "#fff",
    border: `1px solid ${T.accentBorder}`,
    boxShadow: "0 6px 24px rgba(12,18,34,.12)",
    animation: "sheetUp .25s cubic-bezier(.22,1,.36,1)",
    maxWidth: "calc(100vw - 32px)",
  }}>
    <Sparkles size={14} style={{ color: T.accent, flexShrink: 0 }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
        今日の整理を業界仲間と共有しませんか
      </span>
      <span style={{ fontSize: 12, color: T.ink40 }}>
        一行で送れます
      </span>
    </div>
    <button onClick={onInvite} style={{
      marginLeft: 4, height: 28, padding: "0 12px", borderRadius: T.rPill,
      border: "none", background: `linear-gradient(135deg, ${T.accent}, #818cf8)`,
      color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 4,
      whiteSpace: "nowrap",
    }}>
      招待 <ArrowRight size={11} />
    </button>
    <button onClick={onDismiss} style={{
      width: 22, height: 22, borderRadius: 4,
      border: "none", background: "transparent",
      color: T.ink40, cursor: "pointer", flexShrink: 0,
      display: "grid", placeItems: "center",
    }}>
      <X size={12} />
    </button>
  </div>
);


/* ═══════════════════════════════════════════════════════════
   ルートコンポーネント
   スマホファースト: 縦並び・フル幅・下部固定ナビ
   PC: 中央固定幅800〜1000px
   ═══════════════════════════════════════════════════════════ */


export {
  ModalBackdrop, InviteFormModal, InviteSuccessModal,
  SettingsModal, SignupCompleteScreen, AllCaughtUpToast
};
