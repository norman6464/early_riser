# early_riser

プレスリリースエディターアプリケーション

## URL

| 環境 | URL |
|------|-----|
| フロントエンド + API (CloudFront) | https://d3ouxk9k9sbb2.cloudfront.net |
| バックエンド API (ALB) | http://early-riser-alb-771564224.ap-northeast-1.elb.amazonaws.com |

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/press-releases/{id}` | プレスリリース取得 |
| POST | `/api/press-releases/{id}` | プレスリリース保存 |
| POST | `/api/press-releases/{id}/publish` | プレスリリース公開URL生成 |
| GET | `/api/comments/{id}` | コメント取得 |
| POST | `/api/comments/{id}` | コメント保存 |
| POST | `/api/images/presigned-url` | 画像アップロード用プリサインURL取得 |
| GET | `/api/templates` | テンプレート一覧取得 |
| POST | `/api/templates` | テンプレート保存 |
| DELETE | `/api/templates/{id}` | テンプレート削除 |
| GET | `/api/ogp?url=...` | OGP情報取得 |
| POST | `/api/companies` | 会社情報作成 |
| GET | `/api/companies/{id}` | 会社情報取得 |
| PUT | `/api/companies/{id}` | 会社情報更新 |
| GET | `/api/press-release-categories` | カテゴリ一覧取得 |
| POST | `/api/proofread` | AI誤字修正 |
| POST | `/api/ai/generate` | AIテンプレート生成 |
| POST | `/api/ai/suggest-titles` | AIタイトル提案 |
| POST | `/api/ai/analyze-tone` | AIトーン分析 |
| GET | `/api/ai/sections` | セクションガイド定義取得 |
| POST | `/api/ai/generate-section` | AIセクション文章生成 |
| GET | `/api/chat/{id}/history` | AIチャット履歴取得 |
| POST | `/api/chat/{id}` | AIチャット (SSE) |
| GET | `/` | ヘルスチェック |

### フロントエンドからの fetch 例

```typescript
// プレスリリース取得
const res = await fetch("https://d3ouxk9k9sbb2.cloudfront.net/api/press-releases/1");
const data = await res.json();

// プレスリリース保存
await fetch("https://d3ouxk9k9sbb2.cloudfront.net/api/press-releases/1", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "タイトル", content: "コンテンツJSON" }),
});
```

### 画像アップロード（S3プリサインURL）

```typescript
// 1. プリサインURLを取得
const res = await fetch("https://d3ouxk9k9sbb2.cloudfront.net/api/images/presigned-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contentType: "image/png", fileName: "photo.png" }),
});
const { uploadUrl, imageUrl } = await res.json();

// 2. S3に直接アップロード
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "image/png" },
  body: file, // Fileオブジェクト
});

// 3. imageUrl をエディタに挿入
```

## アーキテクチャ

![AWS構成図](architecture/AWS.png)

詳細な構成図: [architecture/AWS.drawio](architecture/AWS.drawio)

### システム構成図

```mermaid
graph TB
    subgraph User["ユーザー"]
        Browser["ブラウザ"]
    end

    subgraph AWS["AWS (ap-northeast-1)"]
        subgraph CDN["CDN / エントリポイント"]
            CF["CloudFront<br/>OAC + URL Rewrite<br/>CF Function"]
        end

        subgraph Frontend["フロントエンド"]
            S3_FE["S3<br/>Next.js 静的ファイル"]
        end

        subgraph Backend["バックエンド"]
            ALB["ALB<br/>ロードバランサー"]
            subgraph ECS["ECS Fargate"]
                PHP["PHP 8.5 / Slim 4<br/>APIサーバー"]
            end
        end

        subgraph Storage["ストレージ"]
            RDS["RDS PostgreSQL 16<br/>press_releases / templates"]
            S3_IMG["S3<br/>画像バケット"]
            S3_PUB["S3<br/>公開プレスリリース"]
        end

        subgraph Serverless["サーバーレス"]
            Lambda["Lambda<br/>画像最適化 (Python)"]
        end

        subgraph CI["CI/CD"]
            ECR["ECR<br/>コンテナレジストリ"]
        end
    end

    subgraph GitHub["GitHub"]
        Repo["リポジトリ"]
        Actions["GitHub Actions<br/>OIDC認証"]
    end

    Browser -->|"HTTPS"| CF
    CF -->|"OAC<br/>(静的ファイル)"| S3_FE
    CF -->|"/api/*<br/>プロキシ"| ALB
    CF -->|"OAC<br/>(公開ページ)"| S3_PUB
    Browser -->|"画像を直接PUT<br/>(プリサインURL)"| S3_IMG
    ALB --> PHP
    PHP -->|"CRUD"| RDS
    PHP -->|"プリサインURL生成"| S3_IMG
    PHP -->|"公開HTML生成"| S3_PUB
    S3_IMG -->|"S3イベント"| Lambda
    Lambda -->|"WebP変換<br/>リサイズ"| S3_IMG
    Repo -->|"push / merge"| Actions
    Actions -->|"php/** 変更時<br/>Docker イメージ push"| ECR
    Actions -->|"nextjs/** 変更時<br/>静的ファイル sync"| S3_FE
    ECR -->|"デプロイ"| ECS
```

### リクエストフロー

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant CF as CloudFront
    participant S3F as S3 (フロントエンド)
    participant ALB as ALB
    participant API as PHP API (ECS)
    participant DB as RDS PostgreSQL
    participant S3I as S3 (画像)

    Note over B,S3F: ページ読み込み
    B->>CF: HTTPS GET /editor
    CF->>CF: CF Function (URL Rewrite)
    CF->>S3F: OAC GET /editor.html
    S3F-->>CF: 静的ファイル
    CF-->>B: HTML/JS/CSS

    Note over B,DB: プレスリリース取得・保存
    B->>CF: GET /api/press-releases/1
    CF->>ALB: /api/* プロキシ
    ALB->>API: リクエスト転送
    API->>DB: SELECT
    DB-->>API: データ
    API-->>B: JSON レスポンス

    B->>CF: POST /api/press-releases/1
    CF->>ALB: /api/* プロキシ
    ALB->>API: リクエスト転送
    API->>DB: UPDATE
    API-->>B: 保存完了

    Note over B,S3I: 画像アップロード
    B->>CF: POST /api/images/presigned-url
    CF->>ALB: /api/* プロキシ
    ALB->>API: リクエスト転送
    API->>S3I: プリサインURL生成
    S3I-->>API: 署名付きURL
    API-->>B: {uploadUrl, imageUrl}
    B->>S3I: PUT (画像バイナリ直接アップロード)
```

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 16 (Static Export) / React / TipTap Editor / TanStack Query |
| バックエンド | PHP 8.5 / Slim Framework 4 |
| データベース | PostgreSQL 16 (RDS) |
| CDN | CloudFront (OAC + CF Function URL Rewrite) |
| 画像最適化 | Lambda (Python / Pillow) |
| インフラ | AWS (ECS Fargate, ALB, S3, RDS, ECR, Lambda, CloudFront) |
| CI/CD | GitHub Actions (OIDC認証) |

## CI/CD

PRを main にマージすると自動デプロイが実行されます。

| ワークフロー | トリガー | デプロイ先 |
|-------------|----------|-----------|
| `deploy-backend.yml` | `webapp/php/**` の変更 | ECR → ECS Fargate |
| `deploy-frontend.yml` | `webapp/nextjs/**` の変更 | S3 → CloudFront |

## ローカル開発

```bash
# バックエンド
cd webapp/php
composer install
php -S localhost:8080 -t public

# フロントエンド
cd webapp/nextjs
npm install
npm run dev
```

## 環境変数

フロントエンド（ビルド時）:
- `NEXT_PUBLIC_API_URL` - バックエンド API の URL（CloudFront URL）

バックエンド（ECS タスク定義 / GitHub Secrets & Variables）:
- `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD`
- `APP_ENV` / `APP_KEY`
- `AWS_BUCKET_IMAGES` / `AWS_BUCKET_IMAGES_URL`
- `OPENAI_API_KEY`
