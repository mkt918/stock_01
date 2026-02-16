# stock_01 プロジェクト ガイド

## プロジェクト概要

中高生向け株式投資シミュレーションアプリ。
実際の売買はなく、仮想資金で株の売買・配当・資産推移を学べる教育用ツール。

- **フレームワーク**: Next.js 16 + React 19 + TypeScript (strict mode)
- **状態管理**: Zustand v5（persist ミドルウェアで localStorage 永続化）
- **デプロイ先**: GitHub Pages（静的エクスポート、basePath: `/stock_01`）
- **テスト**: Vitest v4 + @testing-library/react

## ディレクトリ構成

```
app/          # Next.js App Router ページ
components/   # UIコンポーネント（Dashboard, Market, Portfolio など）
hooks/        # カスタムフック
lib/          # ストア・型定義・API・ユーティリティ
__tests__/    # テスト
public/data/  # 株価・指数データ（GitHub Actions が自動更新）
```

## 開発ルール

- コード変更後は必ず `npm test` と `npm run build` を自動実行すること
- テストが通らない場合はプッシュしないこと
- `public/data/stocks.json` / `public/data/indices.json` は GitHub Actions が自動更新するため、マージコンフリクト時は `--theirs` で解決すること

## 重要な技術的注意事項

- vitest v4 では `pool: 'vmForks'` が必須（`vitest.config.ts` に設定済み）
- vitest setup では `@testing-library/jest-dom/vitest` を使うこと（`/vitest` エントリポイント）
- GitHub Pages のため、内部リンクや fetch は `/stock_01/` プレフィックスが必要
- `Math.random()` は使わず `crypto.randomUUID()` を使うこと
- `alert()` は使わず Toast システム（`hooks/useToast.ts`）を使うこと

## テスト

```bash
npm test              # 全テスト実行
npm run test:watch    # ウォッチモード
npm run test:coverage # カバレッジ計測
```

## 対象ユーザーへの配慮

- 中高生向けのため、UI は直感的でわかりやすくすること
- 専門用語には説明を添えること（例: PER、配当利回りなど）
- エラーメッセージは平易な日本語で書くこと
