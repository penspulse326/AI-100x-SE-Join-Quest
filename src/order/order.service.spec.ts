import { Test, TestingModule } from '@nestjs/testing';
import { OrderService, OrderItem } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(async () => {
    await service.clearPromotions();
  });

  describe('基本功能測試', () => {
    it('應該能夠創建 OrderService 實例', () => {
      expect(service).toBeDefined();
    });

    it('應該能夠清除所有促銷活動', async () => {
      // 先設置一些促銷活動
      await service.configureThresholdDiscount(1000, 100);
      await service.activateBuyOneGetOneForCosmetics();
      await service.activateDoubleElevenPromotion();

      // 清除促銷活動
      await service.clearPromotions();

      // 驗證促銷活動已被清除
      const result = await service.processOrder([
        {
          productName: 'Test',
          quantity: 10,
          unitPrice: 200,
          category: 'cosmetics',
        },
      ]);

      expect(result.summary.discount).toBe(0);
      expect(result.receivedItems[0].quantity).toBe(10); // 沒有買一送一
    });
  });

  describe('邊界條件測試', () => {
    it('應該正確處理空訂單', async () => {
      const result = await service.processOrder([]);

      expect(result.summary.originalAmount).toBe(0);
      expect(result.summary.discount).toBe(0);
      expect(result.summary.totalAmount).toBe(0);
      expect(result.receivedItems).toEqual([]);
    });

    it('應該正確處理數量為 0 的商品', async () => {
      const items: OrderItem[] = [
        { productName: 'Test', quantity: 0, unitPrice: 100 },
      ];

      const result = await service.processOrder(items);

      expect(result.summary.originalAmount).toBe(0);
      expect(result.summary.totalAmount).toBe(0);
      expect(result.receivedItems[0].quantity).toBe(0);
    });

    it('應該正確處理單價為 0 的商品', async () => {
      const items: OrderItem[] = [
        { productName: 'Free Item', quantity: 5, unitPrice: 0 },
      ];

      const result = await service.processOrder(items);

      expect(result.summary.originalAmount).toBe(0);
      expect(result.summary.totalAmount).toBe(0);
      expect(result.receivedItems[0].quantity).toBe(5);
    });

    it('門檻折扣：訂單金額剛好等於門檻值時應該適用折扣', async () => {
      await service.configureThresholdDiscount(1000, 100);

      const items: OrderItem[] = [
        { productName: 'Item', quantity: 10, unitPrice: 100 }, // 總計 1000
      ];

      const result = await service.processOrder(items);

      expect(result.summary.originalAmount).toBe(1000);
      expect(result.summary.discount).toBe(100);
      expect(result.summary.totalAmount).toBe(900);
    });

    it('門檻折扣：訂單金額少於門檻值 1 元時不應適用折扣', async () => {
      await service.configureThresholdDiscount(1000, 100);

      const items: OrderItem[] = [
        { productName: 'Item', quantity: 1, unitPrice: 999 }, // 總計 999
      ];

      const result = await service.processOrder(items);

      expect(result.summary.originalAmount).toBe(999);
      expect(result.summary.discount).toBe(0);
      expect(result.summary.totalAmount).toBe(999);
    });
  });

  describe('雙十一折扣邊界測試', () => {
    beforeEach(async () => {
      await service.activateDoubleElevenPromotion();
    });

    it('購買 9 件商品時不應有折扣', async () => {
      const items: OrderItem[] = [
        { productName: 'Socks', quantity: 9, unitPrice: 100 },
      ];

      const result = await service.processOrderWithDoubleElevenDiscount(items);

      expect(result.summary.originalAmount).toBe(900);
      expect(result.summary.discount).toBe(0);
      expect(result.summary.totalAmount).toBe(900);
      expect(result.discountDetails[0].discountQuantity).toBe(0);
    });

    it('購買 10 件商品時應有 1 組折扣', async () => {
      const items: OrderItem[] = [
        { productName: 'Socks', quantity: 10, unitPrice: 100 },
      ];

      const result = await service.processOrderWithDoubleElevenDiscount(items);

      expect(result.summary.originalAmount).toBe(1000);
      expect(result.summary.discount).toBe(200); // 10 * 100 * 0.2
      expect(result.summary.totalAmount).toBe(800);
      expect(result.discountDetails[0].discountQuantity).toBe(10);
      expect(result.discountDetails[0].discountAmount).toBe(800); // 10 * 100 * 0.8
    });

    it('購買 19 件商品時仍只有 1 組折扣', async () => {
      const items: OrderItem[] = [
        { productName: 'Socks', quantity: 19, unitPrice: 100 },
      ];

      const result = await service.processOrderWithDoubleElevenDiscount(items);

      expect(result.summary.originalAmount).toBe(1900);
      expect(result.summary.discount).toBe(200); // 只有 10 件享受折扣
      expect(result.summary.totalAmount).toBe(1700);
      expect(result.discountDetails[0].discountQuantity).toBe(10);
      expect(result.discountDetails[0].originalQuantity).toBe(9); // 剩餘 9 件原價
    });

    it('購買 20 件商品時應有 2 組折扣', async () => {
      const items: OrderItem[] = [
        { productName: 'Socks', quantity: 20, unitPrice: 100 },
      ];

      const result = await service.processOrderWithDoubleElevenDiscount(items);

      expect(result.summary.originalAmount).toBe(2000);
      expect(result.summary.discount).toBe(400); // 20 * 100 * 0.2
      expect(result.summary.totalAmount).toBe(1600);
      expect(result.discountDetails[0].discountQuantity).toBe(20);
      expect(result.discountDetails[0].originalQuantity).toBe(0); // 全部享受折扣
    });

    it('多種商品時應正確合併相同商品', async () => {
      const items: OrderItem[] = [
        { productName: 'Socks', quantity: 5, unitPrice: 100 },
        { productName: 'Socks', quantity: 7, unitPrice: 100 }, // 總計 12 件
        { productName: 'Shirt', quantity: 8, unitPrice: 200 },
      ];

      const result = await service.processOrderWithDoubleElevenDiscount(items);

      // 找到襪子的折扣明細
      const socksDetail = result.discountDetails.find(
        (d) => d.productName === 'Socks',
      );
      expect(socksDetail).toBeDefined();
      expect(socksDetail!.quantity).toBe(12);
      expect(socksDetail!.discountQuantity).toBe(10);
      expect(socksDetail!.originalQuantity).toBe(2);

      // 找到襯衫的折扣明細
      const shirtDetail = result.discountDetails.find(
        (d) => d.productName === 'Shirt',
      );
      expect(shirtDetail).toBeDefined();
      expect(shirtDetail!.quantity).toBe(8);
      expect(shirtDetail!.discountQuantity).toBe(0); // 不足 10 件
    });
  });

  describe('化妝品買一送一邊界測試', () => {
    beforeEach(async () => {
      await service.activateBuyOneGetOneForCosmetics();
    });

    it('非化妝品類別不應享受買一送一', async () => {
      const items: OrderItem[] = [
        {
          productName: 'T-shirt',
          quantity: 1,
          unitPrice: 500,
          category: 'apparel',
        },
      ];

      const result = await service.processOrder(items);

      expect(result.receivedItems[0].quantity).toBe(1); // 不增加數量
    });

    it('化妝品但沒有設置 category 不應享受買一送一', async () => {
      const items: OrderItem[] = [
        { productName: 'Lipstick', quantity: 1, unitPrice: 300 }, // 沒有 category
      ];

      const result = await service.processOrder(items);

      expect(result.receivedItems[0].quantity).toBe(1);
    });

    it('化妝品類別為空字串不應享受買一送一', async () => {
      const items: OrderItem[] = [
        { productName: 'Lipstick', quantity: 1, unitPrice: 300, category: '' },
      ];

      const result = await service.processOrder(items);

      expect(result.receivedItems[0].quantity).toBe(1);
    });

    it('化妝品類別大小寫敏感測試', async () => {
      const items: OrderItem[] = [
        {
          productName: 'Lipstick',
          quantity: 1,
          unitPrice: 300,
          category: 'Cosmetics',
        }, // 大寫 C
      ];

      const result = await service.processOrder(items);

      expect(result.receivedItems[0].quantity).toBe(1); // 應該不匹配，因為大小寫不同
    });
  });

  describe('促銷活動狀態管理', () => {
    it('雙十一活動啟動和停用應該正確切換', async () => {
      const items: OrderItem[] = [
        { productName: 'Test', quantity: 10, unitPrice: 100 },
      ];

      // 測試未啟動狀態
      await service.deactivateDoubleElevenPromotion();
      let result = await service.processOrderWithDoubleElevenDiscount(items);
      expect(result.summary.discount).toBe(0);

      // 測試啟動狀態
      await service.activateDoubleElevenPromotion();
      result = await service.processOrderWithDoubleElevenDiscount(items);
      expect(result.summary.discount).toBe(200); // 10 * 100 * 0.2

      // 測試再次停用
      await service.deactivateDoubleElevenPromotion();
      result = await service.processOrderWithDoubleElevenDiscount(items);
      expect(result.summary.discount).toBe(0);
    });

    it('門檻折扣配置應該可以更新', async () => {
      const items: OrderItem[] = [
        { productName: 'Test', quantity: 15, unitPrice: 100 }, // 總計 1500
      ];

      // 設置第一個門檻
      await service.configureThresholdDiscount(1000, 100);
      let result = await service.processOrder(items);
      expect(result.summary.discount).toBe(100);

      // 更新門檻配置
      await service.configureThresholdDiscount(2000, 200);
      result = await service.processOrder(items);
      expect(result.summary.discount).toBe(0); // 1500 < 2000

      // 再次更新為更低門檻
      await service.configureThresholdDiscount(1200, 150);
      result = await service.processOrder(items);
      expect(result.summary.discount).toBe(150);
    });
  });
});
