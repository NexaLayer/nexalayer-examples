"""
Multi-region monitor — one session per region, run a check from each.
Requires: NEXALAYER_API_KEY, optional NEXALAYER_BASE_URL.
"""

import os
import sys

try:
    from nexalayer import NexaLayerClient
except ImportError:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../nexalayer-sdk/python"))
    from nexalayer import NexaLayerClient


def main():
    api_key = os.environ.get("NEXALAYER_API_KEY", "your-api-key")
    base_url = os.environ.get("NEXALAYER_BASE_URL", "https://api.nexalayer.net/v1")
    regions = ["US", "GB"]

    client = NexaLayerClient(api_key=api_key, base_url=base_url)

    for country in regions:
        session = client.create_session(
            type="dynamic",
            config={
                "product_no": "out_dynamic_1",
                "traffic_gb": 0.1,
                "protocol": "http",
                "country": country,
            },
        )
        resp = session.get("https://httpbin.org/ip")
        print(f"{country}: session={session.session_id} status={resp.status_code}")


if __name__ == "__main__":
    main()
