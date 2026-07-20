import "dotenv/config";
import { chromium } from "playwright";

const BASE_URL = process.env.NEXALAYER_BASE_URL ?? "https://api.nexalayer.net/v1";
const API_KEY = process.env.NEXALAYER_API_KEY;
const PRODUCT_NO = process.env.NEXALAYER_PRODUCT_NO;
const PROVISIONING_MODE = process.env.NEXALAYER_PROVISIONING_MODE ?? "existing";
const TARGET_URL = process.env.NEXALAYER_TARGET_URL ?? "https://httpbin.org/ip";

if (!API_KEY) {
  throw new Error("Set NEXALAYER_API_KEY");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(method, path, body, headers = {}) {
  const requestHeaders = {
    "X-API-Key": API_KEY,
    ...headers,
  };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(JSON.stringify(json.error ?? json));
  }
  return json.data ?? json;
}

async function pickDynamicProduct() {
  if (PRODUCT_NO) return PRODUCT_NO;
  const products = await api("GET", "/products?type=dynamic");
  const product = (products.items ?? []).find((item) => item.product_no);
  if (!product) throw new Error("No dynamic product available");
  return product.product_no;
}

async function waitForActive(sessionId) {
  for (let i = 0; i < 60; i += 1) {
    const session = await api("GET", `/sessions/${sessionId}`);
    if (session.status === "active") return session;
    if (session.status === "failed" || session.status === "error") {
      throw new Error(`Session failed: ${JSON.stringify(session)}`);
    }
    await sleep(2000);
  }
  throw new Error("Session did not become active within 120s");
}

function toPlaywrightProxy(proxy) {
  if (!proxy?.host || !proxy?.port) throw new Error("Session proxy missing host/port");
  return {
    server: `${proxy.protocol ?? "socks5"}://${proxy.host}:${proxy.port}`,
    username: proxy.username,
    password: proxy.password,
  };
}

let sessionId;
let browser;
let event = {
  event_type: "success",
  status_code: 200,
  target_host: new URL(TARGET_URL).hostname,
};

try {
  const productNo = await pickDynamicProduct();
  const created = await api(
    "POST",
    "/sessions",
    {
      session_type: "dynamic",
      product_no: productNo,
      provisioning_mode: PROVISIONING_MODE,
      quantity: 1,
      protocol: "socks5",
      rotation_mode: "on_demand",
    },
    { "Idempotency-Key": `playwright-${Date.now()}` },
  );
  sessionId = created.session_id;
  console.log("session_id:", sessionId);

  const session = await waitForActive(sessionId);
  console.log("proxy.full_url available:", Boolean(session.proxy?.full_url));

  browser = await chromium.launch({
    headless: true,
    proxy: toPlaywrightProxy(session.proxy),
  });
  const page = await browser.newPage();
  const response = await page.goto(TARGET_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  event.status_code = response?.status() ?? 0;
  event.event_type = response?.ok() ? "success" : "http_error";
  console.log(await page.textContent("body"));
} catch (error) {
  event = {
    event_type: String(error?.message ?? error).toLowerCase().includes("timeout")
      ? "timeout"
      : "http_error",
    status_code: 0,
    target_host: new URL(TARGET_URL).hostname,
  };
  throw error;
} finally {
  await browser?.close().catch(() => {});
  if (sessionId) {
    try {
      await api("POST", `/sessions/${sessionId}/report-event`, event);
    } catch (error) {
      console.error("telemetry failed:", error.message);
    }
    try {
      const health = await api("GET", `/sessions/${sessionId}/health`);
      console.log("health:", health);
    } catch (error) {
      console.error("health query failed:", error.message);
    }
    try {
      const terminated = await api("DELETE", `/sessions/${sessionId}`);
      console.log("terminated:", terminated.session_id ?? sessionId);
    } catch (error) {
      console.error("terminate failed:", error.message);
      throw error;
    }
  }
}
