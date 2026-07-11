# Python Quick Start

Creates a dynamic Session, uses `proxy.full_url` with `requests`, reports telemetry, reads health, and terminates the Session.

This example may create a real paid Session.

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install requests
cp .env.example .env
export NEXALAYER_API_KEY=agk_your_key
python main.py
```

