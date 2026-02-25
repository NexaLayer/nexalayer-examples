# Scraping Agent (Python)

Example: use a NexaLayer dynamic session to run a simple scraping agent with optional rotation.

## Setup

```bash
# From nexalayer-sdk root: pip install -e ".[dev]"
# Or install nexalayer from PyPI when published
export NEXALAYER_API_KEY=your-api-key
export NEXALAYER_BASE_URL=https://api.nexalayer.com/v1
```

## Run

```bash
python main.py
```

## What it does

1. Creates a NexaLayer client and a dynamic session.
2. Performs a sample GET through the session (placeholder: proxy not applied until API returns real config).
3. Optionally rotates the session and fetches again.

See `main.py` for the code. Replace the target URL with your own; ensure compliance with target site ToS.
