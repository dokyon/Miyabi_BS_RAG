# BSサミット用RAGシステム - 使用方法

板金塗装業界向けRAGシステムの使用方法を説明します。

## 🚀 クイックスタート

### 1. 環境変数の設定

`.env` ファイルを作成し、必要なAPIキーを設定します：

```bash
# .env.example をコピー
cp .env.example .env

# 以下の値を実際のAPIキーに置き換えてください
ANTHROPIC_API_KEY=sk-ant-your_key_here
OPENAI_API_KEY=sk-your_key_here
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. サンプルデータの読み込み

```bash
npm run load-sample-data
```

このコマンドで以下のサンプルデータがベクトルデータベースに取り込まれます：
- 顧客情報: 8件
- 見積情報: 7件
- 作業履歴: 8件

### 4. サーバーの起動

```bash
npm start
```

サーバーは `http://localhost:3000` で起動します。

## 📡 API エンドポイント

### ヘルスチェック

```bash
curl http://localhost:3000/health
```

### RAGクエリ（基本）

顧客情報、見積、作業履歴などのデータに対して自然言語で質問できます。

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "山田太郎さんの累計売上はいくらですか？",
    "options": {
      "topK": 5,
      "minScore": 0.5
    }
  }'
```

**レスポンス例:**
```json
{
  "answer": "山田太郎さんの累計売上は450,000円です。",
  "sources": [
    {
      "content": "顧客情報\n顧客ID: CUST-001\n顧客名: 山田太郎\n...",
      "metadata": { "type": "customer", "customerId": "CUST-001" },
      "score": 0.92
    }
  ],
  "confidence": 0.92
}
```

### 会話履歴付きクエリ

前後の会話を考慮した回答が得られます。

```bash
curl -X POST http://localhost:3000/api/query/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "query": "その顧客の来店回数は？",
    "history": [
      {
        "role": "user",
        "content": "山田太郎さんについて教えて"
      },
      {
        "role": "assistant",
        "content": "山田太郎さんは累計売上450,000円のお客様です。"
      }
    ],
    "options": {
      "topK": 5
    }
  }'
```

### データベース状態確認

```bash
curl http://localhost:3000/api/status
```

**レスポンス例:**
```json
{
  "totalDocuments": 23,
  "collectionName": "bankin_crm_data",
  "isInitialized": true
}
```

### データ取り込み

#### 単一ソースから取り込み

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "source": {
      "type": "json",
      "path": "./data/raw/sample_customers.json"
    },
    "dataType": "customer"
  }'
```

#### 複数ソース一括取り込み

```bash
curl -X POST http://localhost:3000/api/ingest/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sources": [
      {
        "source": { "type": "json", "path": "./data/raw/sample_customers.json" },
        "dataType": "customer"
      },
      {
        "source": { "type": "json", "path": "./data/raw/sample_quotes.json" },
        "dataType": "quote"
      }
    ]
  }'
```

#### ディレクトリ一括取り込み

```bash
curl -X POST http://localhost:3000/api/ingest/directory \
  -H "Content-Type: application/json" \
  -d '{
    "directoryPath": "./data/raw",
    "dataType": "customer"
  }'
```

### データベースリセット

**注意: すべてのデータが削除されます**

```bash
curl -X POST http://localhost:3000/api/reset
```

## 💡 クエリ例

### 顧客検索

```json
{
  "query": "VIP顧客を教えてください"
}
```

```json
{
  "query": "東京都在住の顧客は何人いますか？"
}
```

### 見積・売上分析

```json
{
  "query": "全塗装の見積金額の平均はいくらですか？"
}
```

```json
{
  "query": "2024年1月の見積で承認済みのものを教えてください"
}
```

### 作業履歴検索

```json
{
  "query": "ベンツの修理履歴を教えてください"
}
```

```json
{
  "query": "評価が5つ星の作業は何がありますか？"
}
```

### 技術者別分析

```json
{
  "query": "山本職人が担当した作業の平均金額は？"
}
```

## 📊 データフォーマット

### 顧客データ (customer)

```json
{
  "customerId": "CUST-001",
  "name": "山田太郎",
  "phone": "090-1234-5678",
  "email": "yamada@example.com",
  "address": "東京都渋谷区1-2-3",
  "totalSales": 450000,
  "visitCount": 3,
  "registeredAt": "2023-01-15",
  "notes": "リピーター。車検時期は毎年3月"
}
```

### 見積データ (quote)

```json
{
  "quoteId": "Q-2024-001",
  "customerId": "CUST-001",
  "vehicleInfo": "メルセデス・ベンツ Sクラス (2020年式)",
  "items": [
    {
      "description": "フロントバンパー修理・塗装",
      "unitPrice": 85000,
      "quantity": 1,
      "totalPrice": 85000
    }
  ],
  "totalAmount": 135000,
  "status": "承認済み",
  "quoteDate": "2024-01-20",
  "notes": "高級車のため、純正パーツ使用"
}
```

### 作業履歴データ (work_history)

```json
{
  "workId": "WORK-001",
  "customerId": "CUST-001",
  "vehicleInfo": "メルセデス・ベンツ Sクラス (2020年式)",
  "workType": "板金塗装",
  "description": "フロントバンパー修理および塗装作業",
  "technician": "山本職人",
  "workDate": "2024-01-25",
  "partsUsed": [
    {
      "partName": "塗料（純正カラー）",
      "quantity": 1,
      "unitPrice": 18000,
      "totalPrice": 18000
    }
  ],
  "laborCost": 75000,
  "partsCost": 24000,
  "totalCost": 99000,
  "rating": 5,
  "notes": "仕上がりに大変満足いただけました"
}
```

## 🛠 開発用コマンド

```bash
# 開発モードで起動（ホットリロード）
npm run dev

# TypeScript型チェック
npm run typecheck

# ビルド
npm run build

# テスト実行
npm test

# Lint実行
npm run lint
```

## 🔧 トラブルシューティング

### サーバーが起動しない

1. `.env` ファイルが正しく設定されているか確認
2. `ANTHROPIC_API_KEY` と `OPENAI_API_KEY` が有効か確認
3. ポート3000が他のプロセスで使用されていないか確認

### データ取り込みが失敗する

1. JSONファイルのパスが正しいか確認
2. JSONファイルの形式が正しいか確認
3. ChromaDBのディレクトリ（デフォルト: `./data/chromadb`）に書き込み権限があるか確認

### クエリの精度が低い

1. `minScore` の値を調整（デフォルト: 0.5）
2. `topK` の値を増やして、より多くの関連情報を取得
3. より具体的な質問に変更

## 📚 参考資料

- **TypeScript**: プロジェクト全体をTypeScriptで記述
- **ChromaDB**: ベクトルデータベース
- **OpenAI**: テキスト埋め込み生成（text-embedding-3-small）
- **Claude 3.5 Sonnet**: 回答生成
- **Express**: REST APIフレームワーク

## 🌸 Miyabi Framework

このプロジェクトは[Miyabi](https://github.com/ShunsukeHayashi/Autonomous-Operations)フレームワークで構築されています。

詳細は `CLAUDE.md` を参照してください。
