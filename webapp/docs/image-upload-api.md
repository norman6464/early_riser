# 画像アップロード API 仕様書

## 概要

エディタから画像をアップロードし、保存先のURLを返すAPI。
フロントエンド（Next.js）のエディタから画像選択時に即時呼び出される。

## エンドポイント

```
POST /api/upload
```

## リクエスト

### Content-Type

```
multipart/form-data
```

### パラメータ

| フィールド名 | 型   | 必須 | 説明 |
|-------------|------|------|------|
| `file`      | File | Yes  | アップロードする画像ファイル |

### バリデーション

| 項目 | 条件 |
|------|------|
| ファイル形式 | `image/jpeg`, `image/png`, `image/gif`, `image/webp` のみ許可 |
| ファイルサイズ | 5MB以下 |

### リクエスト例（curl）

```bash
curl -X POST /api/upload \
  -F "file=@/path/to/image.png"
```

### フロントエンドからの呼び出し例

```typescript
const formData = new FormData();
formData.append('file', file);

const res = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
const { url } = await res.json();
// url を <img src={url}> としてエディタに挿入
```

## レスポンス

### 成功時（200）

```json
{
  "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.png"
}
```

| フィールド | 型     | 説明 |
|-----------|--------|------|
| `url`     | string | アップロードされた画像のURL。フロントエンドはこのURLをそのまま `<img src>` に使用する |

### エラー時

#### 400 Bad Request — ファイル未指定

```json
{
  "error": "ファイルが見つかりません"
}
```

#### 400 Bad Request — 許可されていない形式

```json
{
  "error": "許可されていないファイル形式です"
}
```

#### 400 Bad Request — サイズ超過

```json
{
  "error": "ファイルサイズは5MB以下にしてください"
}
```

## フロントエンドとの連携フロー

```
1. ユーザーがエディタの「画像追加」ボタンをクリック
2. ファイル選択ダイアログが開く
3. 画像を選択
4. フロントエンド → POST /api/upload（multipart/form-data）
5. バックエンド: バリデーション → 画像を保存 → URLを返却
6. フロントエンド: レスポンスの url をエディタに <img> として挿入
7. ユーザーが「保存」ボタンを押すと、エディタのJSON（画像URLを含む）がDBに保存される
```

## 未使用画像のクリーンアップ（将来対応）

即時アップロード方式のため、以下のケースでサーバーに未使用の画像が残る：

- ユーザーが画像をアップロード後、×ボタンで削除した場合
- ユーザーが画像をアップロード後、保存せずにページを離脱した場合

### 推奨アプローチ

×ボタン押下時にサーバーから削除するのは**非推奨**（Ctrl+Zで元に戻す可能性があるため）。

代わりに、**保存時にバックエンド側でクリーンアップ**を行う：

```
1. フロントエンドが保存リクエスト（POST /api/press-releases/:id）を送信
2. バックエンドはリクエスト内のエディタJSONから使用中の画像URLを抽出
3. ストレージ上の画像一覧と比較し、使われていない画像を削除
```

### エディタJSON内の画像ノードの形式

```json
{
  "type": "image",
  "attrs": {
    "src": "/uploads/550e8400-e29b-41d4-a716-446655440000.png",
    "alt": null,
    "title": null
  }
}
```

JSONを再帰的に走査し、`type: "image"` のノードの `attrs.src` を収集することで使用中の画像URLが取得できる。

## 備考

- ファイル名はサーバー側でUUID（v4）に置換し、元のファイル名は使用しない（衝突回避・セキュリティ対策）
- 拡張子は元のファイル名から引き継ぐ
- 現在はNext.jsのAPI Routeで仮実装中。PHP APIに置き換える際は、同じリクエスト/レスポンス仕様を維持すること
- フロントエンド側の変更箇所: `webapp/nextjs/app/editor/page.tsx` の `UPLOAD_API_URL` 定数をPHP APIのエンドポイントに変更するだけでよい
