# Event Manager B

B向け研修用のイベント管理サイトです。

## 実装している機能

- ログイン / ログアウト
- ロール管理（管理者 / 一般ユーザー）
- イベント一覧表示
- イベント詳細表示
- イベント作成 / 編集 / 削除（管理者）
- イベント参加 / キャンセル（一般ユーザー）
- マイイベント表示
- 検索と絞り込み
- 定員チェック
- 入力バリデーション
- localStorage 保存

## 使用技術

- React
- Vite
- CSS
- localStorage

## デモアカウント

- 管理者: `admin / admin123`
- 一般ユーザー: `user1 / user123`
- 一般ユーザー: `user2 / user123`

## ローカル起動

```bash
npm install
npm run dev
```

Vite のデフォルト URL:

```text
http://localhost:5173
```

## 本番ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## GitHub Pages 公開

Vite 公式の静的デプロイ手順と、GitHub Pages の静的サイト公開手順に沿って公開できます。

- Vite static deploy: https://vite.dev/guide/static-deploy.html
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

このプロジェクトは `vite.config.js` で `base: './'` を設定しているため、静的公開しやすい構成です。
