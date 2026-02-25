"""
Scraping agent example — create session, fetch a URL, optionally rotate.
Requires: NEXALAYER_API_KEY (and optionally NEXALAYER_BASE_URL).
Install nexalayer SDK from nexalayer-sdk repo: pip install -e "path/to/nexalayer-sdk"
"""

import os
import sys

# Allow running when SDK is installed in dev mode from sibling nexalayer-sdk
try:
    from nexalayer import NexaLayerClient
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../nexalayer-sdk/python"))
    from nexalayer import NexaLayerClient


def main():
    api_key = os.environ.get("NEXALAYER_API_KEY", "your-api-key")
    base_url = os.environ.get("NEXALAYER_BASE_URL", "https://api.nexalayer.com/v1")

    client = NexaLayerClient(api_key=api_key, base_url=base_url)
    session = client.create_session(
        type="dynamic",
        config={
            "product_no": "out_dynamic_1",
            "traffic_gb": 1,
            "protocol": "http",
            "country": "US",
        },
    )
    print(f"Session: {session.session_id}")

    # TODO: use session.proxy_config when API returns real proxy
    resp = session.get("https://httpbin.org/ip")
    print(f"Fetch status: {resp.status_code}")

    session.rotate()
    resp2 = session.get("https://httpbin.org/ip")
    print(f"After rotate: {resp2.status_code}")


if __name__ == "__main__":
    main()
