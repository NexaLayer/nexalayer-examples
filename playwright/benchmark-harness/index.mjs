import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.NEXALAYER_BASE_URL ?? "https://api.nexalayer.net/v1";
const API_KEY = process.env.NEXALAYER_API_KEY;
const PRODUCT_NO = process.env.NEXALAYER_PRODUCT_NO;
const RUNS = positiveInteger("BENCHMARK_RUNS", 5);
const TIMEOUT_MS = positiveInteger("BENCHMARK_TIMEOUT_MS", 30_000);
const CONCURRENCY = positiveInteger("BENCHMARK_CONCURRENCY", 1);
const OUTPUT_DIR = path.resolve(process.env.BENCHMARK_OUTPUT_DIR ?? "./results");
const TARGETS = (process.env.BENCHMARK_TARGETS ?? "https://httpbin.org/ip,https://example.com/")
  .split(",").map((value) => value.trim()).filter(Boolean).map((value) => new URL(value).toString());
const VALIDATE_ONLY = process.argv.includes("--validate");

function positiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function api(method, route, body, headers = {}) {
  const requestHeaders = { "X-API-Key": API_KEY, ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  const response = await fetch(`${BASE_URL}${route}`, {
    method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) throw new Error(JSON.stringify(json.error ?? json));
  return json.data ?? json;
}

async function pickProduct() {
  if (PRODUCT_NO) return PRODUCT_NO;
  const products = await api("GET", "/products?type=dynamic");
  const product = (products.items ?? []).find((item) => item.product_no);
  if (!product) throw new Error("No visible dynamic product. Set NEXALAYER_PRODUCT_NO explicitly.");
  return product.product_no;
}

async function waitForActive(sessionId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const session = await api("GET", `/sessions/${sessionId}`);
    if (session.status === "active") return session;
    if (["failed", "error"].includes(session.status)) throw new Error(`Session failed: ${session.status}`);
    await sleep(2_000);
  }
  throw new Error("Session did not become active within 120 seconds");
}

function playwrightProxy(proxy) {
  if (!proxy?.host || !proxy?.port) throw new Error("Session proxy is missing host or port");
  return {
    server: `${proxy.protocol ?? "socks5"}://${proxy.host}:${proxy.port}`,
    username: proxy.username, password: proxy.password,
  };
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function classify(status, body, error) {
  const text = `${body ?? ""} ${error ?? ""}`.toLowerCase();
  const captcha = /captcha|verify you are human|challenge-platform/.test(text);
  const blocked = status === 403 || status === 429 || /access denied|request blocked/.test(text);
  if (captcha) return { outcome: "captcha", captcha: true, blocked };
  if (blocked) return { outcome: "blocked", captcha: false, blocked: true };
  if (error) return { outcome: /timeout/i.test(error) ? "timeout" : "network_error", captcha: false, blocked: false };
  if (status >= 200 && status < 400) return { outcome: "success", captcha: false, blocked: false };
  return { outcome: "http_error", captcha: false, blocked: false };
}

async function runOne(browser, target, run) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const started = performance.now();
  let status = 0;
  let body = "";
  let error = null;
  try {
    const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    status = response?.status() ?? 0;
    body = (await page.textContent("body").catch(() => ""))?.slice(0, 4_000) ?? "";
  } catch (caught) {
    error = String(caught?.message ?? caught).replaceAll(/socks5?:\/\/[^\s@]+@/gi, "socks5://[redacted]@");
  } finally {
    await context.close();
  }
  return {
    target_host: new URL(target).host, run, status_code: status,
    latency_ms: Math.round(performance.now() - started), ...classify(status, body, error),
    error: error?.slice(0, 500) ?? null,
  };
}

async function mapConcurrent(tasks, worker) {
  const results = new Array(tasks.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const index = cursor++;
      results[index] = await worker(tasks[index]);
    }
  }));
  return results;
}

function summarize(observations, chargedAmount) {
  const successful = observations.filter((item) => item.outcome === "success");
  const latencies = successful.map((item) => item.latency_ms);
  return {
    attempts: observations.length, successes: successful.length,
    success_rate: observations.length ? successful.length / observations.length : 0,
    blocked_rate: observations.length ? observations.filter((item) => item.blocked).length / observations.length : 0,
    captcha_rate: observations.length ? observations.filter((item) => item.captcha).length / observations.length : 0,
    latency_ms: { median: percentile(latencies, 0.5), p95: percentile(latencies, 0.95) },
    charged_amount: chargedAmount ?? null,
    cost_per_success: chargedAmount != null && successful.length ? chargedAmount / successful.length : null,
  };
}

const experiment = {
  schema_version: 1, started_at: new Date().toISOString(),
  product_no: PRODUCT_NO || "auto-select-visible-dynamic-product",
  targets: TARGETS.map((target) => new URL(target).host), runs: RUNS,
  concurrency: CONCURRENCY, timeout_ms: TIMEOUT_MS, retry_count: 0, protocol: "socks5",
  failure_taxonomy: ["success", "blocked", "captcha", "timeout", "network_error", "http_error"],
};

if (!TARGETS.length) throw new Error("BENCHMARK_TARGETS must contain at least one URL");
if (VALIDATE_ONLY) { console.log(JSON.stringify(experiment, null, 2)); process.exit(0); }
if (!API_KEY) throw new Error("Set NEXALAYER_API_KEY. Use a dedicated key with a strict spend limit.");

let sessionId;
let browser;
try {
  const productNo = await pickProduct();
  experiment.product_no = productNo;
  const created = await api("POST", "/sessions", {
    session_type: "dynamic", product_no: productNo, quantity: 1,
    protocol: "socks5", rotation_mode: "sticky",
  }, { "Idempotency-Key": `benchmark-${Date.now()}` });
  sessionId = created.session_id;
  const amount = Number(created.charged_amount);
  const chargedAmount = Number.isFinite(amount) ? amount : null;
  const session = await waitForActive(sessionId);
  browser = await chromium.launch({ headless: true, proxy: playwrightProxy(session.proxy) });
  const tasks = TARGETS.flatMap((target) => Array.from({ length: RUNS }, (_, index) => ({ target, run: index + 1 })));
  const observations = await mapConcurrent(tasks, ({ target, run }) => runOne(browser, target, run));
  for (const item of observations) {
    await api("POST", `/sessions/${sessionId}/report-event`, {
      event_type: item.outcome === "success" ? "success" : item.outcome === "timeout" ? "timeout" : "http_error",
      status_code: item.status_code, target_host: item.target_host,
    }).catch(() => {});
  }
  const health = await api("GET", `/sessions/${sessionId}/health`).catch(() => null);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const stamp = experiment.started_at.replaceAll(/[:.]/g, "-");
  await fs.writeFile(path.join(OUTPUT_DIR, `${stamp}.jsonl`), `${observations.map((item) => JSON.stringify(item)).join("\n")}\n`);
  const report = { experiment, summary: summarize(observations, chargedAmount), health };
  await fs.writeFile(path.join(OUTPUT_DIR, `${stamp}.summary.json`), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close().catch(() => {});
  if (sessionId) await api("DELETE", `/sessions/${sessionId}`).catch((error) => console.error(`cleanup failed: ${error.message}`));
}
