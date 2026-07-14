# Desktop Instagram smoke test — 2026-07-14

## Results

- Extension manifest and bundles present: pass
- Instagram match coverage (`https://*.instagram.com/*`): pass
- Content-script markers and MV3 IIFE bundle: pass
- Web/backend startup: pass after limiting Tailwind source scanning
- Extension-shaped API request: reached OpenAI; live model call blocked by account quota (`429 insufficient_quota`)
- Metadata-only fallback: pass, low confidence and explicitly labeled as incomplete
- Automated tests: 9 passed
- Lint, web/extension type checks, web production build, and extension production build: pass in a clean non-OneDrive workspace
- Signed-in Chrome Instagram DOM: not executed because the Chrome-control bridge was unavailable in this session

## Browser verification

Reload extension version 0.1.1 from `apps/extension/dist`, reload the Instagram Reels tab, then open the popup. The detector line should say `active` and report at least one Reel container. If it says `not seen yet`, inspect the extension card in `chrome://extensions` for a content-script error and capture the exact error text.

With the current API quota, Analyze should still return a low-confidence metadata-only label. A funded API key is required for the live GPT-5.6 label.
