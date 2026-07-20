# Playwright Basic Session

Creates a dynamic NexaLayer Session, waits for it to become active, launches Playwright through the returned proxy, reports telemetry, reads health, and terminates the Session in cleanup.

By default this example uses `NEXALAYER_PROVISIONING_MODE=existing` to attach a resource already configured for the account, without placing another order. Contact [Telegram support](https://t.me/ZTPROXY) (@ztproxy) if you need a trial. If you recharged and want NexaLayer to buy a new resource, set the value to `purchase`; that may incur a charge.

```bash
npm install
cp .env.example .env
# Edit .env and fill NEXALAYER_API_KEY
npm start
```

The example loads `.env` automatically. Do not commit the file or print the returned proxy URL because both contain credentials.

The example automatically lists `/products?type=dynamic` and picks the first available product unless `NEXALAYER_PRODUCT_NO` is set.

中文说明：示例会自动读取 `.env`、查询 dynamic 产品，不硬编码旧产品号，并在 `finally` 中执行 Telemetry、Health 和 Terminate。默认 `existing` 会复用售后已经配置的账号资源，避免重复下单或扣费；如需试用请联系 Telegram 售后 @ztproxy。自行充值并购买新资源时改为 `purchase`。请勿提交 `.env`，也不要打印包含凭据的完整代理 URL。
