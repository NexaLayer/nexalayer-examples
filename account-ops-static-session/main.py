"""
Account ops and static session — balance, products, create static session (stub).
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

    client = NexaLayerClient(api_key=api_key, base_url=base_url)

    balance = client.get_balance()
    print(f"Balance: {balance}")

    products = client.get_products()
    print(f"Products: {products}")

    # TODO: use real static product_no from GET /products
    session = client.create_session(
        type="static",
        config={"product_no": "out_static_1", "duration_months": 1},
    )
    print(f"Static session: {session.session_id}")


if __name__ == "__main__":
    main()
