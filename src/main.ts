import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 設定靜態資源目錄
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 設定視圖模板目錄
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  // 設定模板引擎
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
