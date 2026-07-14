# DoomLess AI

A digital-wellbeing prototype that adds a clear "nutrition label" to short-form
videos. Users can select a curated demo video and review seven scores:
Learning, Usefulness, Mind Impact, Quality, Personal Relevance, Time Worth, and
Scroll Risk.

## Live demo

### [Try DoomLess AI →](https://doomless-ai-demo.poojavarshini1995.chatgpt.site)

The public demo includes five Instagram Reel examples and five YouTube Shorts
examples. Select a demo video to see all seven nutrition-label scores and their
explanations—no installation or API key is required.

![DoomLess AI nutrition label](demo-screenshots/02-nutrition-label-top.png)

## Features

- Privacy-safe, client-side demo labels with no external API calls
- Seven scores with one-sentence explanations
- Five Instagram and five YouTube Shorts demo URLs with deterministic labels
- Production-safe labels for the ten curated demo videos
- Animated demo feed cards grouped by content category

## Architecture

- `app/page.tsx`: client-side demo selection, result panel, and ten-video feed.
- `components/NutritionLabel.tsx`: reusable, typed score-card component.
- `lib/nutrition.ts`: shared frontend types and display metadata.
- `lib/demo-videos.ts`: the curated videos and deterministic nutrition labels.

The public MVP contains no OpenAI API integration or API credentials.

## Run locally

1. Install dependencies with `pnpm install`.
2. Run `pnpm dev` and open `http://localhost:3000`.

## Prototype limitation

The prototype recognizes only the ten curated sample URLs. It does not download,
scrape, transcribe, or analyze third-party platform content.

## Security

Never commit `.env`, `.env.local`, or API credentials. Environment files remain
ignored by Git even though this public demo does not require them.
