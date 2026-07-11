import os
import time
import uuid

import requests


BASE_URL = os.getenv("NEXALAYER_BASE_URL", "https://api.nexalayer.net/v1")
API_KEY = os.getenv("NEXALAYER_API_KEY")
PRODUCT_NO = os.getenv("NEXALAYER_PRODUCT_NO")


if not API_KEY:
    raise RuntimeError("Set NEXALAYER_API_KEY")


def api(method, path, **kwargs):
    headers = kwargs.pop("headers", {})
    headers["X-API-Key"] = API_KEY
    if "json" in kwargs:
        headers["Content-Type"] = "application/json"
    res = requests.request(
        method,
        f"{BASE_URL}{path}",
        headers=headers,
        timeout=kwargs.pop("timeout", 30),
        **kwargs,
    )
    res.raise_for_status()
    body = res.json() if res.content else {}
    return body.get("data", body)


def pick_dynamic_product():
    if PRODUCT_NO:
        return PRODUCT_NO
    products = api("GET", "/products?type=dynamic")
    for item in products.get("items", []):
        if item.get("product_no"):
            return item["product_no"]
    raise RuntimeError("No dynamic product available")


def wait_for_active(session_id):
    for _ in range(60):
        session = api("GET", f"/sessions/{session_id}")
        if session.get("status") == "active":
            return session
        if session.get("status") in {"failed", "error"}:
            raise RuntimeError(f"Session failed: {session}")
        time.sleep(2)
    raise TimeoutError("Session did not become active within 120s")


session_id = None
event = {"event_type": "success", "status_code": 200, "target_host": "httpbin.org"}

try:
    product_no = pick_dynamic_product()
    created = api(
        "POST",
        "/sessions",
        headers={"Idempotency-Key": f"python-quickstart-{uuid.uuid4()}"},
        json={
            "session_type": "dynamic",
            "product_no": product_no,
            "quantity": 1,
            "protocol": "socks5",
            "rotation_mode": "on_demand",
        },
    )
    session_id = created["session_id"]
    print("session_id:", session_id)

    session = wait_for_active(session_id)
    proxy_url = session.get("proxy", {}).get("full_url")
    if not proxy_url:
        raise RuntimeError("Active session did not include proxy.full_url")

    try:
        res = requests.get(
            "https://httpbin.org/ip",
            proxies={"http": proxy_url, "https": proxy_url},
            timeout=30,
        )
        event["event_type"] = "success" if res.ok else "http_error"
        event["status_code"] = res.status_code
        print("httpbin:", res.text[:120])
    except requests.Timeout:
        event["event_type"] = "timeout"
        event["status_code"] = 0
finally:
    if session_id:
        api("POST", f"/sessions/{session_id}/report-event", json=event)
        print("health:", api("GET", f"/sessions/{session_id}/health"))
        api("DELETE", f"/sessions/{session_id}")
        print("terminated:", session_id)

