# NexaLayer Examples

Runnable examples for NexaLayer managed network sessions.

**Keep using proxies. Stop managing them.**

NexaLayer provides hosted network Sessions for Playwright, Puppeteer, Browser Use, AI agents, and automation scripts. These examples show how to query products, create Sessions, use `proxy.full_url`, report telemetry, read health, and clean up resources.

中文入口: [README.zh-CN.md](./README.zh-CN.md)

## Scenario guide

| Scenario | Example | Recommended for |
| --- | --- | --- |
| First API call | [Python Quick Start](./python/quickstart) | Everyone |
| Playwright | [Playwright basic session](./playwright/basic-session) | Browser automation |
| Dynamic proxy script | [Dynamic Session](./python/dynamic-session) | Data access and short-lived jobs |
| Fixed network identity | [Static Session](./python/static-session) | Compliant long-running tasks |
| Diagnose proxy issues | [Telemetry + Health](./playwright/telemetry-health) | Technical teams |

## Safety and billing

- Examples that create Sessions may create real paid resources.
- Recharge and use NexaLayer directly, or contact Telegram support at https://t.me/ZTPROXY (@ztproxy) if you need a trial. Use `provisioning_mode=existing` for resources already configured by support.
- Every Session example includes timeout handling and `finally` cleanup.
- Do not use these examples to violate target website terms or applicable law.
- Never commit `.env`, API keys, proxy credentials, cookies, or account passwords.

## Requirements

- Python 3.9+ for Python examples
- Node.js 18+ for Node/Playwright examples
- `NEXALAYER_API_KEY`
- Optional `NEXALAYER_BASE_URL`, defaulting to `https://api.nexalayer.net/v1`
- Optional `NEXALAYER_PRODUCT_NO` when you need a specific product

## Documentation

- Chinese Quick Start: https://docs.nexalayer.net/zh/quick-start
- English Quick Start: https://docs.nexalayer.net/en/quick-start
- API Reference: https://docs.nexalayer.net/api-reference/openapi
