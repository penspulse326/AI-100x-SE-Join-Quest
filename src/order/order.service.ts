import { Injectable } from '@nestjs/common';

/**
 * 訂單項目介面
 * @description 定義單一商品項目的基本資訊
 */
export interface OrderItem {
  /** 商品名稱 */
  productName: string;
  /** 購買數量 */
  quantity: number;
  /** 商品單價 */
  unitPrice: number;
  /** 商品類別（可選），用於特定促銷邏輯 */
  category?: string;
}

/**
 * 訂單摘要介面
 * @description 包含訂單金額計算的摘要資訊
 */
export interface OrderSummary {
  /** 原始金額（未折扣前） */
  originalAmount?: number;
  /** 總折扣金額 */
  discount?: number;
  /** 最終應付金額 */
  totalAmount: number;
}

/**
 * 實際收到商品介面
 * @description 定義客戶實際收到的商品資訊（包含贈品）
 */
export interface ReceivedItem {
  /** 商品名稱 */
  productName: string;
  /** 實際收到的數量（含贈品） */
  quantity: number;
}

/**
 * 折扣詳情介面
 * @description 提供詳細的折扣計算明細
 */
export interface DiscountDetail {
  /** 商品名稱 */
  productName: string;
  /** 總購買數量 */
  quantity: number;
  /** 商品單價 */
  unitPrice: number;
  /** 享有折扣的數量 */
  discountQuantity: number;
  /** 折扣後的金額 */
  discountAmount: number;
  /** 原價計算的數量 */
  originalQuantity: number;
  /** 原價金額 */
  originalAmount: number;
  /** 該商品的小計金額 */
  subtotal: number;
}

/**
 * 一般訂單結果介面
 * @description 包含訂單摘要和實際收到商品的完整結果
 */
export interface OrderResult {
  /** 訂單金額摘要 */
  summary: OrderSummary;
  /** 實際收到的商品列表 */
  receivedItems: ReceivedItem[];
}

/**
 * 雙11訂單結果介面
 * @description 包含訂單摘要和詳細折扣明細的完整結果
 */
export interface DoubleElevenOrderResult {
  /** 訂單金額摘要 */
  summary: OrderSummary;
  /** 各商品的折扣詳細明細 */
  discountDetails: DiscountDetail[];
}

/**
 * 訂單服務類別
 * @description 處理各種訂單計算邏輯，包含多種促銷活動的支援
 */
@Injectable()
export class OrderService {
  /** 門檻折扣設定：當訂單金額達到門檻時可享有的折扣 */
  private thresholdDiscountConfig: {
    threshold: number;
    discount: number;
  } | null = null;

  /** 化妝品買一送一活動啟用狀態 */
  private buyOneGetOneForCosmeticsActive: boolean = false;

  /** 雙11促銷活動啟用狀態 */
  private doubleElevenPromotionActive: boolean = false;

  /**
   * 清除所有促銷活動設定
   * @description 重置所有促銷設定為預設狀態
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  clearPromotions(): Promise<void> {
    this.thresholdDiscountConfig = null;
    this.buyOneGetOneForCosmeticsActive = false;
    this.doubleElevenPromotionActive = false;
    return Promise.resolve();
  }

  /**
   * 處理一般訂單
   * @description 計算訂單金額並套用門檻折扣和買一送一邏輯
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {Promise<OrderResult>} 包含訂單摘要和實際收到商品的結果
   */
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

  /**
   * 設定門檻折扣
   * @description 設定當訂單金額達到指定門檻時可享有的固定折扣金額
   * @param {number} threshold - 門檻金額
   * @param {number} discount - 折扣金額
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  configureThresholdDiscount(
    threshold: number,
    discount: number,
  ): Promise<void> {
    this.thresholdDiscountConfig = { threshold, discount };
    return Promise.resolve();
  }

  /**
   * 啟用化妝品買一送一活動
   * @description 啟用後，category 為 'cosmetics' 的商品將享有買一送一優惠
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  activateBuyOneGetOneForCosmetics(): Promise<void> {
    this.buyOneGetOneForCosmeticsActive = true;
    return Promise.resolve();
  }

  /**
   * 啟用雙11促銷活動
   * @description 啟用後，商品將享有滿10件8折的優惠
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  activateDoubleElevenPromotion(): Promise<void> {
    this.doubleElevenPromotionActive = true;
    return Promise.resolve();
  }

  /**
   * 停用雙11促銷活動
   * @description 停用雙11促銷，恢復正常定價
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  deactivateDoubleElevenPromotion(): Promise<void> {
    this.doubleElevenPromotionActive = false;
    return Promise.resolve();
  }

  /**
   * 處理雙11促銷訂單
   * @description 根據雙11促銷活動狀態處理訂單，提供詳細的折扣明細
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {Promise<DoubleElevenOrderResult>} 包含訂單摘要和折扣詳情的結果
   */
  processOrderWithDoubleElevenDiscount(
    items: OrderItem[],
  ): Promise<DoubleElevenOrderResult> {
    if (!this.doubleElevenPromotionActive) {
      return Promise.resolve(this.processOrderWithoutDiscount(items));
    }

    return Promise.resolve(this.processOrderWithDoubleElevenPromotion(items));
  }

  /**
   * 處理無折扣的訂單
   * @description 當雙11促銷未啟用時，按原價計算訂單
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {DoubleElevenOrderResult} 無折扣的訂單結果
   * @private
   */
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

  /**
   * 處理雙11促銷訂單
   * @description 套用雙11促銷邏輯，計算滿10件8折的優惠
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {DoubleElevenOrderResult} 包含雙11折扣的訂單結果
   * @private
   */
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

  /**
   * 計算原始訂單金額
   * @description 計算所有商品項目的原始總金額（未折扣前）
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {number} 原始總金額
   * @private
   */
  private calculateOriginalAmount(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  /**
   * 建立無折扣的商品詳情
   * @description 為無折扣的商品建立詳情物件
   * @param {OrderItem} item - 商品項目
   * @returns {DiscountDetail} 無折扣的商品詳情
   * @private
   */
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

  /**
   * 依商品名稱群組化商品項目
   * @description 將相同商品名稱的項目合併，避免重複計算
   * @param {OrderItem[]} items - 訂單商品項目陣列
   * @returns {Map<string, OrderItem>} 以商品名稱為 key 的商品 Map
   * @private
   */
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

  /**
   * 計算雙11折扣
   * @description 實作滿10件8折的折扣邏輯，不足10件的部分維持原價
   * @param {OrderItem} item - 商品項目
   * @returns {DiscountDetail} 包含詳細折扣計算的商品明細
   * @private
   */
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
