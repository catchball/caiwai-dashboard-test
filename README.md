# caiwAi Dashboard

## Quick Start

```bash
cd app
npm install
npm run dev
```

ブラウザで `http://localhost:5173` が開く。現時点ではモックデータで動作。

## ファイル構成

```
app/
├── index.html          # エントリHTML（フォント、CSSアニメーション定義）
├── package.json        # 依存: react, lucide-react, recharts
├── vite.config.js      # Vite設定（GitHub Pages base path）
├── public/             # 静的アセット
└── src/
    ├── main.jsx        # ReactDOM.createRoot
    ├── App.jsx         # App Shell（ローディング管理）
    ├── dashboard.jsx   # メインダッシュボード（v10g-uiux）
    ├── useSheetData.js # Google Sheets CSV取得フック（L1/L2段階ロード）
    ├── XEmbed.jsx      # X埋め込み最適化（キュー制御、IO遅延、fallback）
    └── YouTubeLite.jsx # YouTube Lite Embed（サムネ先行→タップでiframe）
```

## スプシ接続

1. `useSheetData.js` の `SPREADSHEET_ID` にシートIDを設定
2. Google Sheets → ファイル → 共有 → ウェブに公開 → 各シートをCSV形式で公開
3. シート名: `articles`, `detections`, `highlights`, `domains`
4. 詳細は `../SHEET_SPEC.md` を参照

## GitHub Pages デプロイ

```bash
npm run build      # dist/ に静的ファイル生成
npm run deploy     # gh-pages で dist/ をデプロイ
```

`vite.config.js` の `base` を自分のリポジトリ名に合わせて変更する:
```js
base: '/your-repo-name/',
```

## 技術スタック

- Vite 6 + React 18
- lucide-react（アイコン）
- recharts（チャート）
- Google Sheets CSV（データソース、段階的ロード）

## embed最適化

### X (Twitter)
- `XEmbed.jsx`: IntersectionObserver で viewport 近接時のみ embed 実行
- 同時実行キュー（MAX_CONCURRENCY=2）で SDK 負荷制御
- 10秒タイムアウト → fallback カード + リトライボタン
- `twttr.widgets.createTweet` を requestIdleCallback で実行

### YouTube
- `YouTubeLite.jsx`: サムネイル画像を先に表示、タップで iframe 生成
- iframe は一度生成したら保持（再生中に消えない）
- IntersectionObserver でサムネのロードも遅延
