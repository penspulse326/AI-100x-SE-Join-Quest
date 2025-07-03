import { Given, When, Then, DataTable, BeforeAll } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderService,
  OrderItem,
  OrderSummary,
  DiscountDetail,
} from '../../src/order/order.service';
import { OrderModule } from '../../src/order/order.module';

// 導入 Node.js 的 assert
import * as assert from 'assert';

let orderService: OrderService;
let orderItems: OrderItem[] = [];
let orderSummary: OrderSummary;
let discountDetails: DiscountDetail[] = [];
let productList: { productName: string; unitPrice: number }[] = [];

// 設定測試環境
BeforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [OrderModule],
  }).compile();

  orderService = moduleFixture.get<OrderService>(OrderService);
});

Given('雙十一優惠活動已啟動', async function () {
  await orderService.activateDoubleElevenPromotion();
});

Given('雙十一優惠活動未啟動', async function () {
  await orderService.deactivateDoubleElevenPromotion();
});

Given(
  '商品{word}的單價為 {int} 元',
  async function (_productName: string, _unitPrice: number) {
    // 這個步驟先暫不實作，因為商品價格會在 When 步驟中設定
  },
);

When(
  '顧客購買 {int} 件{word}',
  async function (quantity: number, productName: string) {
    orderItems = [
      {
        productName: productName,
        quantity: quantity,
        unitPrice: 100, // 根據 Given 步驟的設定
      },
    ];

    const result =
      await orderService.processOrderWithDoubleElevenDiscount(orderItems);
    orderSummary = result.summary;
    discountDetails = result.discountDetails;
  },
);

Then('訂單總價應為 {int} 元', function (expectedTotal: number) {
  assert.strictEqual(orderSummary.totalAmount, expectedTotal);
});

Then('折扣明細應為:', function (dataTable: DataTable) {
  const expectedDetails = dataTable.hashes();

  expectedDetails.forEach((expected, index) => {
    const actual = discountDetails[index];
    assert.ok(actual, `第 ${index + 1} 筆折扣明細不存在`);
    assert.strictEqual(actual.productName, expected.商品名稱);
    assert.strictEqual(actual.quantity, parseInt(expected.數量));
    assert.strictEqual(actual.unitPrice, parseInt(expected.單價));
    assert.strictEqual(actual.discountQuantity, parseInt(expected.折扣數量));
    assert.strictEqual(actual.discountAmount, parseInt(expected.折扣價格));
    assert.strictEqual(actual.originalQuantity, parseInt(expected.原價數量));
    assert.strictEqual(actual.originalAmount, parseInt(expected.原價價格));
    assert.strictEqual(actual.subtotal, parseInt(expected.小計));
  });
});

Then('不應有任何折扣', function () {
  // 檢查沒有折扣
  assert.strictEqual(orderSummary.discount, 0);
});

Given(
  '有以下商品各一件，每件價格為 {int} 元:',
  function (unitPrice: number, dataTable: DataTable) {
    const products = dataTable.hashes();
    productList = products.map((product) => ({
      productName: product.商品名稱,
      unitPrice: unitPrice,
    }));
  },
);

When('顧客購買上述所有商品', async function () {
  orderItems = productList.map((product) => ({
    productName: product.productName,
    quantity: 1,
    unitPrice: product.unitPrice,
  }));

  const result =
    await orderService.processOrderWithDoubleElevenDiscount(orderItems);
  orderSummary = result.summary;
  discountDetails = result.discountDetails;
});
