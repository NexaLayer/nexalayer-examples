"""
Session rotation demo — create session, rotate N times, get usage.
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
    base_url = os.environ.get("NEXALAYER_BASE_URL", "https://api.nexalayer.com/v1")

    client = NexaLayerClient(api_key=api_key, base_url=base_url)
    session = client.create_session(
        type="dynamic",
        config={"product_no": "out_dynamic_1", "traffic_gb": 1},
    )
    print(f"Session: {session.session_id}")

    for i in range(3):
        session.rotate()
        print(f"Rotate {i + 1} ok")

    usage = session.usage()
    print(f"Usage: {usage}")


if __name__ == "__main__":
    main()
