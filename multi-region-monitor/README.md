# Multi-Region Monitor (Python)

Example: run the same check from multiple regions using one NexaLayer session per region (placeholder).

## Setup

```bash
export NEXALAYER_API_KEY=your-api-key
export NEXALAYER_BASE_URL=https://api.nexalayer.com/v1
```

## Run

```bash
python main.py
```

## What it does

1. Creates a session per region (e.g. US, GB) with matching `country` in config.
2. Performs a simple HTTP GET (e.g. to httpbin.org/ip) through each session.
3. Prints status per region. In production, you would use returned proxy configs for each session.
