/**
 * parseHighlight — B方式のハイライトテキストを segments 配列に変換
 *
 * 入力: "ミツカンの納豆値上げ[12]、ナフサ高騰[13,54]が背景"
 * 出力: [
 *   { t: "ミツカンの納豆値上げ", ids: [12] },
 *   "、",
 *   { t: "ナフサ高騰", ids: [13, 54] },
 *   "が背景"
 * ]
 *
 * ルール:
 * - [数字] or [数字,数字,...] は直前のテキストに紐づくリンク
 * - リンクなしのテキストは文字列としてそのまま出力
 * - 連続する [id] は直前のテキスト chunk に付与
 */
export default function parseHighlight(text) {
  if (!text) return [];

  // [数字] or [数字,数字] のパターンで分割
  // キャプチャグループで区切り文字も保持
  const parts = text.split(/(\[[0-9,\s]+\])/);
  const segments = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // [id] パターン?
    const idMatch = part.match(/^\[([0-9,\s]+)\]$/);
    if (idMatch) {
      const ids = idMatch[1].split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      // 直前の segment にリンクを付与
      if (segments.length > 0) {
        const prev = segments[segments.length - 1];
        if (typeof prev === "string") {
          // 文字列 → リンクオブジェクトに昇格
          segments[segments.length - 1] = { t: prev, ids };
        } else if (prev && typeof prev === "object" && prev.t) {
          // 既にオブジェクト → ids を追加/マージ
          prev.ids = [...(prev.ids || []), ...ids];
        }
      }
      continue;
    }

    // 通常テキスト
    // [id] の直前のテキストを切り出す
    // "ミツカンの納豆値上げ" のように、次の [id] で拾われるべき部分
    // ただし、途中にリンクなしテキスト（句読点など）が混ざることもある
    //
    // 例: "ミツカンの納豆値上げ" + [12] + "、" + "ナフサ高騰" + [13,54] + "が背景"
    //
    // [id] の直前にあるテキストが「リンク対象」になる。
    // [id] がない後続テキストはプレーン文字列。

    // 次の要素が [id] パターンかチェック
    const nextPart = parts[i + 1];
    const nextIsId = nextPart && /^\[[0-9,\s]+\]$/.test(nextPart);

    if (nextIsId) {
      // このテキストは次の [id] のリンク対象になるので、そのまま push
      // （[id] 処理時にオブジェクトに昇格される）
      segments.push(part);
    } else {
      // リンクなしプレーンテキスト
      segments.push(part);
    }
  }

  return segments;
}

/**
 * highlights シートの1行（3行テキスト）をパースする
 *
 * 入力テキスト:
 * "5/7\nミツカンの...[12]...\nミツカン納豆値上げ一斉報道"
 *
 * 出力:
 * { date: "5/7", segments: [...], collapsed: "..." }
 */
export function parseHighlightRow(rawText) {
  if (!rawText) return null;
  const lines = String(rawText).split("\n").map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  return {
    date: lines[0],
    segments: parseHighlight(lines[1]),
    collapsed: lines[2] || lines[1].replace(/\[[0-9,\s]+\]/g, "").slice(0, 30),
  };
}
