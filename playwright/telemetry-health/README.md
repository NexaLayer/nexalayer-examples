# Telemetry + Health Demo

This scenario reuses the Playwright basic session flow and focuses on the telemetry and health output.

```bash
npm install
cp .env.example .env
export NEXALAYER_API_KEY=agk_your_key
npm start
```

The script reports `success`, `http_error`, or `timeout`, then reads `/sessions/{session_id}/health` before cleanup.

