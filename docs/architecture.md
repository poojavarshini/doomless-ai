# Architecture

## Current state

DoomLess combines a hosted Next.js/Vinext analyzer with a Manifest V3 Chrome extension. Both surfaces use the same strict 0–100 analysis contract and deterministic decision policy.

## Boundaries

- `apps/extension/src/content.tsx`: discovers Reel containers, schedules analysis, and renders the isolated Shadow DOM decision label.
- `apps/extension/src/reels.ts`: defensive DOM extraction and stable hashing; it never fetches media URLs.
- `apps/extension/src/background.ts`: API access, timeout, duplicate suppression, schema validation, demo routing, cache, and action writes.
- `apps/extension/src/popup.tsx`: local behavior dashboard, exposure metrics, and recent decisions.
- `apps/extension/src/options.tsx`: consent, triggers, demo mode, personalization, retention, and deletion controls.
- `app/api/analyze/route.ts`: validates requests, calls OpenAI, validates structured output, applies policy, and logs latency without content.
- `packages/shared-types`: shared request, response, preferences, and history contract.
- `packages/scoring`: score formula, evidence gate, Return on Attention, recommendation policy, and relevance matching.

## Analysis lifecycle

Only a visible Reel, an 800 ms hover, or an explicit Analyze click schedules work. The service worker checks the schema-aware cache and an in-flight map before starting a 15-second request. The server and service worker both validate the result. Old cached schemas are rejected and removed. DOM removal disconnects observers and unmounts React.

## Decision contract

The result contains content classification, a recommendation object, Return on Attention, user benefit, evidence quality, seven category scores with reasons and evidence, positive and warning signals, a summary, and a suggested action. Confidence below 40 or unknown content forces `ANALYZE_MORE`.

## Score formula

Positive value is Learning 25%, Actionability 20%, Personal Relevance 20%, Time Efficiency 20%, and Emotional Impact 15%. Risk penalty is Clickbait 10% plus Addiction 15%. The raw -25 to 100 range is normalized to 0–100. Evidence confidence, classification, Return on Attention, and risk overrides then determine the recommendation in code.

## Deployment

The web/API surface is a Vinext Cloudflare Worker built through Sites. The extension is a separate static Vite artifact loaded unpacked for the beta.
