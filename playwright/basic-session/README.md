# Playwright Basic Session

Creates a dynamic NexaLayer Session, waits for it to become active, launches Playwright through the returned proxy, reports telemetry, reads health, and terminates the Session in cleanup.

This example may create a real paid Session.

```bash
npm install
cp .env.example .env
# Fill NEXALAYER_API_KEY in .env
npm start
```

The example automatically lists `/products?type=dynamic` and picks the first available product unless `NEXALAYER_PRODUCT_NO` is set.

中文说明：这个示例会自动查询 dynamic 产品，不硬编码旧产品号，并在 `finally` 中执行 cleanup。

