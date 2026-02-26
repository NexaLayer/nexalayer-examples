# Account Ops & Static Session (Python)

Example: account operations (balance, products) and a static session (placeholder). Use when you need a fixed IP for a period.

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

1. Fetches billing balance and product list.
2. Creates a static session (product_no and duration depend on your catalog; see docs).
3. Placeholder until static products and session response are defined in the API.
