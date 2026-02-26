# Session Rotation Demo (Python)

Minimal demo: create one dynamic session, rotate several times, and check usage (stub).

## Setup

```bash
export NEXALAYER_API_KEY=your-api-key
export NEXALAYER_BASE_URL=https://api.nexalayer.net/v1
```

## Run

```bash
python main.py
```

## What it does

1. Creates a single dynamic session.
2. Calls rotate N times (e.g. 3).
3. Fetches session usage. Useful to verify rotation and usage endpoints; real proxy config applied when API is live.
