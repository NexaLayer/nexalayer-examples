# Reproducible Proxy Benchmark Harness

This harness publishes the method behind NexaLayer benchmark claims. It measures task success, HTTP status, end-to-end latency, block/CAPTCHA signals, and cost per successful task. Raw anonymized observations and a machine-readable summary are written locally so results can be audited instead of accepted from screenshots.

It creates one NexaLayer dynamic Session, runs the declared target matrix through that proxy, reports telemetry, reads health, and always attempts cleanup. Runs may create paid resources. Use a dedicated API key with a strict spend limit.

## Run

```bash
npm install
npx playwright install chromium
cp .env.example .env
# Fill NEXALAYER_API_KEY and, if needed, NEXALAYER_PRODUCT_NO.
npm run validate
npm start
```

`npm run validate` checks the experiment definition without creating a Session or making target requests.

## Pre-register the experiment

Set these before running and include them with published results:

- `BENCHMARK_TARGETS`: comma-separated public URLs you are authorized to test.
- `BENCHMARK_RUNS`: repetitions per target (default `5`).
- `BENCHMARK_CONCURRENCY`: workers (default `1`; intentionally conservative).
- `BENCHMARK_TIMEOUT_MS`: navigation timeout (default `30000`).
- `NEXALAYER_PRODUCT_NO`: exact product, or leave blank to select the first visible dynamic product.

The output includes the UTC start time, configuration, per-run observations, median and p95 latency, success/block/CAPTCHA rates, and cost per successful task when the API returns a charge. It never writes the API key or proxy credentials.

## Fair-use rules

- Respect target terms, robots rules, rate limits, and applicable law.
- Do not change targets, timeouts, retries, or the failure taxonomy after seeing results.
- Compare providers with the same geography, protocol, concurrency, target order, and run count.
- Publish failures and raw anonymized JSONL alongside the summary.
- State when cost is unavailable; do not infer it from a marketing price.
