# NexaLayer 示例

这些示例面向中文开发者，展示如何用 NexaLayer 托管网络 Session 来接入 Playwright、Python 脚本和自动化任务。

**代理继续使用，代理管理交给 NexaLayer。**

## 场景导航

| 场景 | 示例 | 推荐用户 |
| --- | --- | --- |
| 第一次调用 | [Python Quick Start](./python/quickstart) | 所有人 |
| Playwright | [Playwright 中文 Demo](./playwright/basic-session) | 浏览器自动化 |
| 动态代理脚本 | [Dynamic Session](./python/dynamic-session) | 数据采集与短周期任务 |
| 固定网络身份 | [Static Session](./python/static-session) | 合规长期任务 |
| 诊断代理问题 | [Telemetry + Health](./playwright/telemetry-health) | 技术团队 |

## 重要说明

- 创建 Session 可能产生真实费用。
- 默认示例使用最小可行配置，并在 `finally` 中清理资源。
- 示例会自动查询可用产品，不硬编码旧产品号。
- 请遵守目标网站条款和适用法律。
- 不要提交 `.env`、API Key、代理凭证、Cookie 或账号密码。

## 快速开始

```bash
cd playwright/basic-session
npm install
cp .env.example .env
# 编辑 .env，填入 NEXALAYER_API_KEY
npm start
```

