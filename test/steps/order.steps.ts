import { Given, When, Then, DataTable, BeforeAll } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderService,
  OrderItem,
  OrderSummary,
  ReceivedItem,
} from '../../src/order/order.service';
import { OrderModule } from '../../src/order/order.module';

// 導入 Node.js 的 assert
import * as assert from 'assert';

let orderService: OrderService;
let orderItems: OrderItem[] = [];
let orderSummary: OrderSummary;
let receivedItems: ReceivedItem[] = [];

// 設定測試環境
BeforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [OrderModule],
  }).compile();

  orderService = moduleFixture.get<OrderService>(OrderService);
});

Given('no promotions are applied', async function () {
  // 清空所有促銷設定
  await orderService.clearPromotions();
});

When('a customer places an order with:', async function (dataTable: DataTable) {
  const items = dataTable.hashes();
  orderItems = items.map((item) => ({
    productName: item.productName,
    quantity: parseInt(item.quantity),
    unitPrice: parseInt(item.unitPrice),
    category: item.category,
  }));

  // 處理訂單
  const result = await orderService.processOrder(orderItems);
  orderSummary = result.summary;
  receivedItems = result.receivedItems;
});

Then('the order summary should be:', function (dataTable: DataTable) {
  const expected = dataTable.hashes()[0];

  if (expected.totalAmount) {
    assert.strictEqual(
      orderSummary.totalAmount,
      parseInt(expected.totalAmount),
    );
  }

  if (expected.originalAmount) {
    assert.strictEqual(
      orderSummary.originalAmount,
      parseInt(expected.originalAmount),
    );
  }

  if (expected.discount) {
    assert.strictEqual(orderSummary.discount, parseInt(expected.discount));
  }
});

Then('the customer should receive:', function (dataTable: DataTable) {
  const expected = dataTable.hashes();

  expected.forEach((expectedItem) => {
    const receivedItem = receivedItems.find(
      (item) => item.productName === expectedItem.productName,
    );
    assert.ok(
      receivedItem,
      `Product ${expectedItem.productName} should be received`,
    );
    assert.strictEqual(receivedItem.quantity, parseInt(expectedItem.quantity));
  });
});

Given(
  'the threshold discount promotion is configured:',
  async function (dataTable: DataTable) {
    const config = dataTable.hashes()[0];
    await orderService.configureThresholdDiscount(
      parseInt(config.threshold),
      parseInt(config.discount),
    );
  },
);

Given(
  'the buy one get one promotion for cosmetics is active',
  async function () {
    await orderService.activateBuyOneGetOneForCosmetics();
  },
);
