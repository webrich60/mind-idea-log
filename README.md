# Life Compass Coach｜人生統合AIコーチ v4.3 NotebookLM対応

GitHub Pages + GAS + Google スプレッドシートで動く、人生記録・AIコーチング・マインドマップ可視化ツールです。

## v4.3で追加したこと

- NotebookLMにそのまま追加しやすい `LifeCompass_NotebookLM_Source` シートを自動生成
- 保存データを通常の保存シートだけでなく、NotebookLM向け整理シートにも自動追記
- 必要なときだけ `LifeCompass_NotebookLM_Summary` Google Docsを作成・更新
- 写真ファイルをGAS経由でGoogle Driveフォルダに保存
- スプレッドシートには写真ファイル本体ではなく、DriveファイルID・Drive表示URL・参考URLを保存
- 既存スプレッドシートIDを `SPREADSHEET_ID` で指定可能
- 写真フォルダ `WEBRICH_LifeCompass_Photos` を利用。`DRIVE_FOLDER_ID` 未設定ならGASが同名フォルダを自動作成

## GitHubにアップするファイル

- `index.html`
- `app.js`
- `README.md`

## Apps Scriptに貼るファイル

- `Code.gs`

## GASスクリプトプロパティ

最低限、既存のスプレッドシートを使う場合：

- `SPREADSHEET_ID` : スプレッドシートIDだけ

写真保存フォルダを手動指定する場合：

- `DRIVE_FOLDER_ID` : Google DriveフォルダIDだけ

AIを使う場合：

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

モデル名は `Code.gs` 内に固定しています。

- Gemini: `gemini-2.5-flash`
- ChatGPT: `gpt-5.4-mini`
- fallback: `gpt-5-mini`

## NotebookLMのおすすめ運用

1. NotebookLMにはスプレッドシート本体をソースとして追加します。
2. その中でも `LifeCompass_NotebookLM_Source` シートは、NotebookLMが読みやすいように整理されたシートです。
3. さらに深く分析したい時だけ、アプリの「バックアップ」タブから「NotebookLM用まとめDocsを作成/更新」を押します。
4. 表示された `docUrl` をNotebookLMに追加します。

## GAS初期設定

1. 既存のスプレッドシートを開く
2. 拡張機能 → Apps Script
3. `Code.gs` を貼り替える
4. スクリプトプロパティに `SPREADSHEET_ID` を設定
5. 写真フォルダを手動作成した場合は `DRIVE_FOLDER_ID` も設定
6. `setupLifeCompassSheet()` を1回実行
7. Webアプリとしてデプロイ
8. `/exec` で終わるGAS URLをアプリの「バックアップ」タブに保存

## 注意

- 既往歴やトラウマは非常に個人的な情報です。スプレッドシート・Driveフォルダ・NotebookLMの共有設定は必ず非公開で運用してください。
- 写真はDriveに保存し、スプレッドシートにはURLとファイルIDだけ保存します。
- NotebookLMはスプレッドシート更新を参照できますが、反映タイミングにラグが出る可能性があります。重要な分析前はNotebookLM側でソースの再確認や再生成をしてください。


## v4.3 追加：PC・スマホ同期

この版では、Googleスプレッドシートを中心にして、PCとスマホのデータを同期できます。

### 使い方

1. Apps Scriptに `Code.gs` を貼り替えます。
2. `setupLifeCompassSheet()` を一度実行します。
3. Webアプリを再デプロイします。
4. GitHubには `index.html` / `app.js` / `README.md` を上書きします。
5. PCとスマホの両方で、バックアップタブに同じGAS WebアプリURLを設定します。
6. 「起動時にスプレッドシートから自動取得する」をONにします。
7. 必要に応じて「完全同期（送信→取得）」を押します。

### 同期の考え方

- この端末で保存したデータは、GAS経由でスプレッドシートへ送信されます。
- 別端末では、起動時または手動ボタンでスプレッドシートから取得して、この端末のブラウザ保存と統合します。
- GAS URLだけは端末ごとに一度設定してください。
- 念のため、大きな編集前はJSONバックアップを推奨します。

