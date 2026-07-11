const BASE_URL = process.env.NEXALAYER_BASE_URL ?? "https://api.nexalayer.net/v1";
const API_KEY = process.env.NEXALAYER_API_KEY;
const PRODUCT_NO = process.env.NEXALAYER_PRODUCT_NO;

if (!API_KEY) {
  throw new Error("Set NEXALAYER_API_KEY");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(method, path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
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

let sessionId;
try {
  const productNo = await pickDynamicProduct();
  const created = await api(
    "POST",
    "/sessions",
    {
      session_type: "dynamic",
      product_no: productNo,
      quantity: 1,
      protocol: "socks5",
      rotation_mode: "on_demand",
    },
    { "Idempotency-Key": `node-quickstart-${Date.now()}` },
  );
  sessionId = created.session_id;
  console.log("session_id:", sessionId);

  const session = await waitForActive(sessionId);
  console.log("proxy.full_url available:", Boolean(session.proxy?.full_url));

  await api("POST", `/sessions/${sessionId}/report-event`, {
    event_type: "success",
    status_code: 200,
    target_host: "httpbin.org",
  });
  console.log("health:", await api("GET", `/sessions/${sessionId}/health`));
} finally {
  if (sessionId) {
    await api("DELETE", `/sessions/${sessionId}`).catch(() => {});
    console.log("terminated:", sessionId);
  }
}
