import { Injectable } from '@nestjs/common';

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

export interface OrderSummary {
  originalAmount?: number;
  discount?: number;
  totalAmount: number;
}

export interface ReceivedItem {
  productName: string;
  quantity: number;
}

export interface OrderResult {
  summary: OrderSummary;
  receivedItems: ReceivedItem[];
}

@Injectable()
export class OrderService {
  private thresholdDiscountConfig: {
    threshold: number;
    discount: number;
  } | null = null;
  private buyOneGetOneForCosmeticsActive: boolean = false;

  clearPromotions(): Promise<void> {
    this.thresholdDiscountConfig = null;
    this.buyOneGetOneForCosmeticsActive = false;
    return Promise.resolve();
  }

  processOrder(items: OrderItem[]): Promise<OrderResult> {
    // 計算原始金額
    const originalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // 計算門檻折扣
    let discount = 0;
    if (
      this.thresholdDiscountConfig &&
      originalAmount >= this.thresholdDiscountConfig.threshold
    ) {
      discount = this.thresholdDiscountConfig.discount;
    }

    // 計算最終金額
    const totalAmount = originalAmount - discount;

    // 建立收到的商品列表
    const receivedItems = items.map((item) => {
      let receivedQuantity = item.quantity;

      // 化妝品買一送一邏輯
      if (
        this.buyOneGetOneForCosmeticsActive &&
        item.category === 'cosmetics'
      ) {
        receivedQuantity = item.quantity + 1;
      }

      return {
        productName: item.productName,
        quantity: receivedQuantity,
      };
    });

    return Promise.resolve({
      summary: {
        originalAmount: originalAmount,
        discount: discount,
        totalAmount: totalAmount,
      },
      receivedItems: receivedItems,
    });
  }

  configureThresholdDiscount(
    threshold: number,
    discount: number,
  ): Promise<void> {
    this.thresholdDiscountConfig = { threshold, discount };
    return Promise.resolve();
  }

  activateBuyOneGetOneForCosmetics(): Promise<void> {
    this.buyOneGetOneForCosmeticsActive = true;
    return Promise.resolve();
  }
}
