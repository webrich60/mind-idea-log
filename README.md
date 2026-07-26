# Life Compass Coach｜人生統合AIコーチ v4

GitHub Pages + GAS + Google スプレッドシートで動く、人生記録・AIコーチング・マインドマップ可視化ツールです。

## v4で追加したこと

- 上部タブをカテゴリ別の淡い色に変更
- 各記録に参考URL・写真URL・写真ファイル・タグを添付可能
- 写真ファイルはブラウザ内に圧縮保存
- 「履歴インポート」タブを追加
  - 自分の人生履歴、仕事実績、健康履歴、過去ログ、会話メモなどを貼り付け可能
  - txt / md / csv / json ファイルの読み込みにも対応
- AIコーチがインポート履歴も含めて傾向分析
- 「マインドマップ」タブを追加
  - 現在地、心の声、気づき、反省、前提、未来、目標、履歴、AI履歴を視覚化
  - 自分全体 / 未来設計 / 前提の整理 / 履歴傾向 / AI分析で切り替え可能
- GAS保存の列に linkUrl / imageUrl / tags / hasImage を追加

## GitHubにアップするファイル

- `index.html`
- `app.js`
- `README.md`

## Apps Scriptに貼るファイル

- `Code.gs`

## GASプロパティ

Geminiを使う場合：

- `GEMINI_API_KEY`

ChatGPTを使う場合：

- `OPENAI_API_KEY`

モデル名は `Code.gs` 内に固定しています。

- Gemini: `gemini-2.5-flash`
- ChatGPT: `gpt-5.4-mini`
- fallback: `gpt-5-mini`

## 使い方

1. Googleスプレッドシートを作成
2. Apps Scriptを開く
3. `Code.gs` を貼り付け
4. `setupLifeCompassSheet()` を1回実行
5. Webアプリとしてデプロイ
6. `/exec` で終わるGAS URLをコピー
7. アプリの「バックアップ」タブに貼り付け
8. 接続テスト

## 注意

- スマホとPCではブラウザ保存領域が別です。
- 長く使う場合はJSONバックアップを定期的に保存してください。
- 写真ファイルをたくさん保存するとブラウザ容量を使います。重くなる場合は写真URL添付を優先してください。
- APIキーはGitHubに絶対に書かず、GASのスクリプトプロパティに保存してください。
