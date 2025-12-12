/**
 * CRMConnectorのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMConnector } from '../../src/connectors/crmConnector.js';
import type { Customer, Quote, WorkHistory } from '../../src/types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('CRMConnector', () => {
  let connector: CRMConnector;

  beforeEach(() => {
    connector = new CRMConnector();
  });

  describe('convertToText', () => {
    it('should convert customer data to text format', () => {
      const customer: Customer = {
        customerId: 'CUST-001',
        name: '山田太郎',
        phone: '090-1234-5678',
        email: 'yamada@example.com',
        address: '東京都渋谷区1-2-3',
        totalSales: 450000,
        visitCount: 3,
        registeredAt: '2023-01-15',
        notes: 'リピーター顧客',
      };

      const text = connector.convertToText(customer, 'customer');

      expect(text).toContain('顧客情報');
      expect(text).toContain('CUST-001');
      expect(text).toContain('山田太郎');
      expect(text).toContain('090-1234-5678');
      expect(text).toContain('450,000円');
    });

    it('should convert quote data to text format', () => {
      const quote: Quote = {
        quoteId: 'Q-2024-001',
        customerId: 'CUST-001',
        vehicleInfo: 'トヨタ プリウス (2020年式)',
        items: [
          {
            description: 'フロントバンパー修理',
            unitPrice: 50000,
            quantity: 1,
            totalPrice: 50000,
          },
        ],
        totalAmount: 50000,
        status: '承認済み',
        quoteDate: '2024-01-20',
        notes: '急ぎ対応',
      };

      const text = connector.convertToText(quote, 'quote');

      expect(text).toContain('見積情報');
      expect(text).toContain('Q-2024-001');
      expect(text).toContain('トヨタ プリウス');
      expect(text).toContain('フロントバンパー修理');
      expect(text).toContain('50,000円');
    });

    it('should convert work history data to text format', () => {
      const work: WorkHistory = {
        workId: 'WORK-001',
        customerId: 'CUST-001',
        vehicleInfo: 'トヨタ プリウス (2020年式)',
        workType: '板金塗装',
        description: 'フロントバンパー修理および塗装',
        technician: '山本職人',
        workDate: '2024-01-25',
        partsUsed: [
          {
            partName: '塗料',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
          },
        ],
        laborCost: 30000,
        partsCost: 15000,
        totalCost: 45000,
        rating: 5,
        notes: '仕上がり良好',
      };

      const text = connector.convertToText(work, 'work_history');

      expect(text).toContain('作業履歴');
      expect(text).toContain('WORK-001');
      expect(text).toContain('板金塗装');
      expect(text).toContain('山本職人');
      expect(text).toContain('45,000円');
      expect(text).toContain('5つ星');
    });
  });

  describe('loadData', () => {
    it('should load JSON data from file', async () => {
      const testData = [
        {
          customerId: 'CUST-TEST',
          name: 'テスト太郎',
          phone: '000-0000-0000',
          totalSales: 100000,
          visitCount: 1,
        },
      ];

      // テスト用一時ファイルを作成
      const tempDir = path.join(process.cwd(), 'tests', 'fixtures');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'test-customers.json');
      await fs.writeFile(tempFile, JSON.stringify(testData));

      try {
        const data = await connector.loadData({
          type: 'json',
          path: tempFile,
        });

        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({
          customerId: 'CUST-TEST',
          name: 'テスト太郎',
        });
      } finally {
        // クリーンアップ
        await fs.unlink(tempFile);
      }
    });

    it('should throw error for invalid file path', async () => {
      await expect(
        connector.loadData({
          type: 'json',
          path: '/nonexistent/file.json',
        })
      ).rejects.toThrow();
    });

    it('should throw error for unsupported data source type', async () => {
      await expect(
        connector.loadData({
          type: 'excel' as any,
          path: './test.xlsx',
        })
      ).rejects.toThrow('Excel読み込みは未実装です');
    });
  });
});
