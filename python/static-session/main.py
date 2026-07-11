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
    res = requests.request(method, f"{BASE_URL}{path}", headers=headers, timeout=30, **kwargs)
    res.raise_for_status()
    body = res.json() if res.content else {}
    return body.get("data", body)


def pick_static_product():
    if PRODUCT_NO:
        return PRODUCT_NO
    products = api("GET", "/products?type=static")
    for item in products.get("items", []):
        if item.get("product_no"):
            return item["product_no"]
    raise RuntimeError("No static product available")


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
try:
    created = api(
        "POST",
        "/sessions",
        headers={"Idempotency-Key": f"python-static-{uuid.uuid4()}"},
        json={
            "session_type": "static",
            "product_no": pick_static_product(),
            "quantity": 1,
            "duration": 30,
            "protocol": "socks5",
        },
    )
    session_id = created["session_id"]
    print("session_id:", session_id)
    session = wait_for_active(session_id)
    print("proxy.full_url available:", bool(session.get("proxy", {}).get("full_url")))
finally:
    if session_id:
        api("DELETE", f"/sessions/{session_id}")
        print("terminated:", session_id)

