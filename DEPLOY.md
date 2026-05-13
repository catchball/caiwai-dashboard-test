# GitHub Pages デプロイ手順

## 前提
- `app/dist/` にプロダクションビルド済み
- `vite.config.js` の `base: '/caiwai-dashboard/'` でパスが設定済み

## 方法A: gh-pages パッケージ（推奨）

```bash
cd app
npm install --save-dev gh-pages

# package.json の scripts に追加:
# "deploy": "gh-pages -d dist"

npm run build
npm run deploy
```

公開URL: `https://<username>.github.io/caiwai-dashboard/`

## 方法B: 手動デプロイ

```bash
# 1. GitHub に caiwai-dashboard リポジトリを作成

# 2. dist を gh-pages ブランチとしてプッシュ
cd app/dist
git init
git checkout -b gh-pages
git add -A
git commit -m "deploy"
git remote add origin https://github.com/<username>/caiwai-dashboard.git
git push -f origin gh-pages

# 3. GitHub > Settings > Pages > Source: gh-pages branch
```

## 方法C: GitHub Actions（CI/CD）

`.github/workflows/deploy.yml` をリポジトリに追加:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd app && npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist
      - uses: actions/deploy-pages@v4
```

## ローカル確認

```bash
cd app
npm run build
npx vite preview
# http://localhost:4173/caiwai-dashboard/ で確認
```

## バンドル構成（v10g-split）

| ファイル | サイズ | gzip | ロードタイミング |
|---|---|---|---|
| index.js | 125KB | 40KB | 初期（Watch画面） |
| lucide.js | 18KB | 5KB | 初期 |
| recharts.js | 518KB | 150KB | 分析タブ切替時 |
| AnalysisViews.js | 17KB | 6KB | 分析タブ切替時 |
| ReportMode.js | 7KB | 3KB | レポートタブ切替時 |

Watch 画面の初期ロード: **143KB (gzip 45KB)**
