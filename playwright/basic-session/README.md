# Playwright Basic Session

Creates a dynamic NexaLayer Session, waits for it to become active, launches Playwright through the returned proxy, reports telemetry, reads health, and terminates the Session in cleanup.

This example may create a real paid Session.

```bash
npm install
cp .env.example .env
# Edit .env and fill NEXALAYER_API_KEY
npm start
```

The example loads `.env` automatically. Do not commit the file or print the returned proxy URL because both contain credentials.

The example automatically lists `/products?type=dynamic` and picks the first available product unless `NEXALAYER_PRODUCT_NO` is set.

中文说明：示例会自动读取 `.env`、查询 dynamic 产品，不硬编码旧产品号，并在 `finally` 中执行 cleanup。请勿提交 `.env`，也不要打印包含凭据的完整代理 URL。
