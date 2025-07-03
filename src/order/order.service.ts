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

export interface DiscountDetail {
  productName: string;
  quantity: number;
  unitPrice: number;
  discountQuantity: number;
  discountAmount: number;
  originalQuantity: number;
  originalAmount: number;
  subtotal: number;
}

export interface OrderResult {
  summary: OrderSummary;
  receivedItems: ReceivedItem[];
}

export interface DoubleElevenOrderResult {
  summary: OrderSummary;
  discountDetails: DiscountDetail[];
}

@Injectable()
export class OrderService {
  private thresholdDiscountConfig: {
    threshold: number;
    discount: number;
  } | null = null;
  private buyOneGetOneForCosmeticsActive: boolean = false;
  private doubleElevenPromotionActive: boolean = false;

  clearPromotions(): Promise<void> {
    this.thresholdDiscountConfig = null;
    this.buyOneGetOneForCosmeticsActive = false;
    this.doubleElevenPromotionActive = false;
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

  activateDoubleElevenPromotion(): Promise<void> {
    this.doubleElevenPromotionActive = true;
    return Promise.resolve();
  }

  deactivateDoubleElevenPromotion(): Promise<void> {
    this.doubleElevenPromotionActive = false;
    return Promise.resolve();
  }

  processOrderWithDoubleElevenDiscount(
    items: OrderItem[],
  ): Promise<DoubleElevenOrderResult> {
    if (!this.doubleElevenPromotionActive) {
      return Promise.resolve(this.processOrderWithoutDiscount(items));
    }

    return Promise.resolve(this.processOrderWithDoubleElevenPromotion(items));
  }

  private processOrderWithoutDiscount(
    items: OrderItem[],
  ): DoubleElevenOrderResult {
    const originalAmount = this.calculateOriginalAmount(items);

    return {
      summary: {
        originalAmount: originalAmount,
        discount: 0,
        totalAmount: originalAmount,
      },
      discountDetails: items.map((item) => this.createNoDiscountDetail(item)),
    };
  }

  private processOrderWithDoubleElevenPromotion(
    items: OrderItem[],
  ): DoubleElevenOrderResult {
    const groupedItems = this.groupItemsByProduct(items);
    const discountDetails: DiscountDetail[] = [];
    let totalAmount = 0;
    let totalDiscount = 0;
    let originalAmount = 0;

    groupedItems.forEach((item) => {
      const itemDetail = this.calculateDoubleElevenDiscount(item);
      discountDetails.push(itemDetail);

      totalAmount += itemDetail.subtotal;
      totalDiscount += item.quantity * item.unitPrice - itemDetail.subtotal;
      originalAmount += item.quantity * item.unitPrice;
    });

    return {
      summary: {
        originalAmount: originalAmount,
        discount: totalDiscount,
        totalAmount: totalAmount,
      },
      discountDetails: discountDetails,
    };
  }

  private calculateOriginalAmount(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  private createNoDiscountDetail(item: OrderItem): DiscountDetail {
    const subtotal = item.quantity * item.unitPrice;
    return {
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountQuantity: 0,
      discountAmount: 0,
      originalQuantity: item.quantity,
      originalAmount: subtotal,
      subtotal: subtotal,
    };
  }

  private groupItemsByProduct(items: OrderItem[]): Map<string, OrderItem> {
    const groupedItems = new Map<string, OrderItem>();
    items.forEach((item) => {
      const existing = groupedItems.get(item.productName);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.set(item.productName, { ...item });
      }
    });
    return groupedItems;
  }

  private calculateDoubleElevenDiscount(item: OrderItem): DiscountDetail {
    const discountSets = Math.floor(item.quantity / 10);
    const discountQuantity = discountSets * 10;
    const originalQuantity = item.quantity - discountQuantity;

    const discountAmount = discountQuantity * item.unitPrice * 0.8; // 80% 折扣
    const originalPrice = originalQuantity * item.unitPrice;
    const subtotal = discountAmount + originalPrice;

    return {
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountQuantity: discountQuantity,
      discountAmount: discountAmount,
      originalQuantity: originalQuantity,
      originalAmount: originalPrice,
      subtotal: subtotal,
    };
  }
}
