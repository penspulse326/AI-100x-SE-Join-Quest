import { Given, When, Then } from '@cucumber/cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

let app: INestApplication;

Given('應用程式已啟動', async function () {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});

When('我執行 {string} 操作', function (action: string) {
  // 這裡可以實作具體的操作邏輯
  console.log(`執行操作: ${action}`);
});

Then('我應該看到 {string} 結果', function (expectedResult: string) {
  // 這裡可以實作結果驗證邏輯
  console.log(`期待結果: ${expectedResult}`);
});

// 在測試結束後清理
process.on('exit', () => {
  if (app) {
    app.close().catch(console.error);
  }
});
