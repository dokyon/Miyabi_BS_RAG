/**
 * サンプルデータローディングスクリプト
 * data/raw/*.json からサンプルデータを読み込み、ベクトルデータベースに取り込む
 */

import { getDataIngestionService } from '../services/dataIngestion.js';
import type { DataIngestionRequest } from '../types/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * サンプルデータを読み込む
 */
async function loadSampleData(): Promise<void> {
  console.log('');
  console.log('🌸 BSサミット用RAGシステム - サンプルデータ読み込み');
  console.log('==========================================');
  console.log('');

  try {
    const service = getDataIngestionService();

    // プロジェクトルートからの相対パス
    const projectRoot = path.resolve(__dirname, '../..');

    // データソース定義
    const dataSources: DataIngestionRequest[] = [
      {
        source: {
          type: 'json',
          path: path.join(projectRoot, 'data/raw/sample_customers.json'),
        },
        dataType: 'customer',
      },
      {
        source: {
          type: 'json',
          path: path.join(projectRoot, 'data/raw/sample_quotes.json'),
        },
        dataType: 'quote',
      },
      {
        source: {
          type: 'json',
          path: path.join(projectRoot, 'data/raw/sample_work_history.json'),
        },
        dataType: 'work_history',
      },
    ];

    console.log('📥 データ取り込み開始...\n');

    // 一括取り込み
    const result = await service.ingestBulk(dataSources);

    console.log('');
    console.log('✅ データ取り込み完了！');
    console.log('==========================================');
    console.log(`📊 合計: ${result.total}件のデータを取り込みました`);
    console.log('');
    console.log('内訳:');
    console.log(`  - 顧客情報: ${result.byType.customer || 0}件`);
    console.log(`  - 見積情報: ${result.byType.quote || 0}件`);
    console.log(`  - 作業履歴: ${result.byType.work_history || 0}件`);
    console.log('');
    console.log('🚀 RAGシステムの準備が整いました！');
    console.log('');
    console.log('次のステップ:');
    console.log('  1. サーバーを起動: npm start');
    console.log('  2. クエリを送信: POST http://localhost:3000/api/query');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ データ読み込みエラー:', error.message);
    console.error('');
    console.error('トラブルシューティング:');
    console.error('  1. .env ファイルが正しく設定されているか確認してください');
    console.error('  2. ANTHROPIC_API_KEY と OPENAI_API_KEY が設定されているか確認してください');
    console.error('  3. data/raw/ ディレクトリにサンプルデータファイルが存在するか確認してください');
    console.error('');
    process.exit(1);
  }
}

// スクリプト実行
loadSampleData();
