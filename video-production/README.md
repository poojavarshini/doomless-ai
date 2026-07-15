# DoomLess AI — 3-minute project video

This folder contains the reproducible first-draft production pipeline for the DoomLess AI hackathon video.

## Story arc

- 0:00–0:30 — The problem
- 0:29–0:59 — Why existing solutions are not enough
- 0:58–1:29 — Live Chrome beta on Instagram Reels
- 1:28–1:58 — Compare different types of content
- 1:57–2:31 — AI and technology
- 2:30–3:00 — Vision and closing

The one-second visual crossfades deliberately overlap chapter boundaries. Narration starts are staggered to create continuous pacing without two voices speaking over each other.

## Sources

- `DoomLess_Demo.mp4` — existing branded pitch visuals
- `C:\Users\Pooja\OneDrive\Desktop\DOOMLESS AI\dommless demo 1.mp4` — real Chrome beta-test recording on Instagram Reels
- `public/og-beta.png` — current DoomLess AI brand/title art

The Instagram footage is used as an authentic beta recording. No unsupported live-media access is simulated.

## Narration and render

1. `generate-voiceover.mjs` creates six narration chapters with `gpt-audio-1.5` and the `marin` voice.
   If the OpenAI account has no available API quota, `generate-local-voiceover.ps1` produces a reviewable first-draft track with the best installed Windows female voice.
2. `render-video.py` trims the real Instagram recording, creates crossfaded visual chapters, fits narration to the target pace, adds captions and a subtle generated music bed, and exports a 1920×1080 H.264 MP4.

The final draft is written to `video-production/output/DoomLess_AI_3min_First_Draft.mp4`.

## Draft 2 voice

`generate-neural-voiceover.py` creates a clearer, more energetic review track with the `en-US-AriaNeural` female voice. Chapter starts are separated by only 50 milliseconds, removing the narration gaps from Draft 1 while retaining natural sentence endings.
