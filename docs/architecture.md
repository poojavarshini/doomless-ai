# Architecture

## Current state

The repository began as a hosted Next.js/Vinext short-video scoring prototype with a server-side OpenAI route, reusable label component, and curated web demo. The first extension slice preserves that app and adds two workspace packages plus an MV3 extension.

## Boundaries

- `apps/extension/src/content.tsx`: discovers Reel containers, schedules analysis, and renders an isolated Shadow DOM overlay.
- `apps/extension/src/reels.ts`: defensive extraction and stable hashing. It does not fetch media URLs.
- `apps/extension/src/background.ts`: owns API access, timeout, duplicate suppression, schema validation, cache, and action writes.
- `apps/extension/src/popup.tsx`: local daily summary and recent history.
- `apps/extension/src/options.tsx`: consent, trigger, backend, relevance, retention, and deletion controls.
- `app/api/analyze/route.ts`: validates input, calls OpenAI, validates output, applies deterministic product policy, and records latency without logging content.
- `packages/shared-types`: the cross-surface contract.
- `packages/scoring`: formula, recommendation overrides, and lightweight relevance matching.

## Analysis lifecycle

Only a visible Reel, an 800 ms hover, or an explicit Analyze click can schedule work. The service worker checks cache and an in-flight map before starting a 15-second request. The backend returns strict JSON. The service worker validates it again before local storage. DOM removal disconnects observers and unmounts React.

## Score formula

Positive value is Learning 25%, Actionability 20%, Relevance 20%, Time Efficiency 20%, and Emotional Impact 15%. Risk penalty is Clickbait 10% plus Addiction 15%. The resulting -25…100 raw range is normalized to 0…100. Risk override rules are code, not prompt-only policy.

## Deployment

The web/API surface remains a Vinext Cloudflare Worker built through Sites. The extension is a separate static Vite artifact loaded unpacked for the MVP.
