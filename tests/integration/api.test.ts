/**
 * REST API統合テスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// テスト用の簡易APIサーバーセットアップ
const app = express();
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'test',
  });
});

// モックRAGクエリエンドポイント
app.post('/api/query', (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'クエリが指定されていません' });
  }

  // モックレスポンス
  res.json({
    answer: 'これはテスト用のモック回答です。',
    sources: [
      {
        content: 'テスト用コンテンツ',
        metadata: { type: 'customer' },
        score: 0.85,
      },
    ],
    confidence: 0.85,
  });
});

// モック会話型RAGエンドポイント
app.post('/api/query/conversation', (req, res) => {
  const { query, history } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'クエリが指定されていません' });
  }

  if (!Array.isArray(history)) {
    return res.status(400).json({ error: '会話履歴が正しい形式ではありません' });
  }

  res.json({
    answer: '会話履歴を考慮したモック回答です。',
    sources: [],
    confidence: 0.75,
  });
});

// モックデータ取り込みエンドポイント
app.post('/api/ingest', (req, res) => {
  const { source, dataType } = req.body;

  if (!source || !dataType) {
    return res.status(400).json({ error: 'source と dataType が必要です' });
  }

  res.json({
    success: true,
    message: '5件のデータを取り込みました',
    count: 5,
  });
});

// モックステータスエンドポイント
app.get('/api/status', (req, res) => {
  res.json({
    totalDocuments: 23,
    collectionName: 'bankin_crm_data',
    isInitialized: true,
  });
});

describe('REST API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('POST /api/query', () => {
    it('should accept valid query and return response', async () => {
      const response = await request(app).post('/api/query').send({
        query: 'VIP顧客を教えてください',
        options: {
          topK: 5,
          minScore: 0.5,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('sources');
      expect(response.body).toHaveProperty('confidence');
      expect(Array.isArray(response.body.sources)).toBe(true);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app).post('/api/query').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('クエリが指定されていません');
    });

    it('should handle query with options', async () => {
      const response = await request(app).post('/api/query').send({
        query: '見積金額の平均は？',
        options: {
          topK: 10,
          minScore: 0.7,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBeDefined();
    });
  });

  describe('POST /api/query/conversation', () => {
    it('should accept conversational query with history', async () => {
      const response = await request(app)
        .post('/api/query/conversation')
        .send({
          query: 'その顧客の来店回数は？',
          history: [
            {
              role: 'user',
              content: '山田太郎さんについて教えて',
            },
            {
              role: 'assistant',
              content: '山田太郎さんは累計売上450,000円のお客様です。',
            },
          ],
          options: {
            topK: 5,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('sources');
    });

    it('should return 400 for invalid history format', async () => {
      const response = await request(app)
        .post('/api/query/conversation')
        .send({
          query: 'テストクエリ',
          history: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('会話履歴が正しい形式ではありません');
    });
  });

  describe('POST /api/ingest', () => {
    it('should accept data ingestion request', async () => {
      const response = await request(app)
        .post('/api/ingest')
        .send({
          source: {
            type: 'json',
            path: './data/raw/sample_customers.json',
          },
          dataType: 'customer',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/ingest').send({
        source: {
          type: 'json',
        },
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/status', () => {
    it('should return database status', async () => {
      const response = await request(app).get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDocuments');
      expect(response.body).toHaveProperty('collectionName');
      expect(response.body).toHaveProperty('isInitialized');
      expect(typeof response.body.totalDocuments).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/query')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});
