# Known limitations

- Instagram has no stable public DOM contract for Reels. Detection is defensive, but selectors may require updates.
- The MVP does not scrape video files, bypass access controls, use private Instagram APIs, or claim reliable transcript access.
- Caption-only analysis cannot assess frames, audio, pacing, loops, delivery, or factual accuracy. It therefore returns low confidence and `ANALYZE_MORE` rather than a precise decision.
- Private-content detection is heuristic. Automatic analysis is blocked on a private signal; users should not send content they lack permission to analyze.
- Screenshot-assisted multimodal analysis is represented in the schema but is not implemented in this beta.
- The popup provides daily and seven-day summary KPIs, exposure counts, recent decisions, and topic mix—not a research-grade analytics suite.
- Demo mode contains six simulated fixtures. It uses the real schema and policy but does not describe the Reel underneath the overlay.
- “Replace with Better Content” records intent but does not fetch a replacement recommendation yet.
- “Show Less Like This” records the action; automatic preference learning remains deliberately lightweight.
- Attention saved, useful seconds, and filler seconds are transparent product estimates, not scientific measurements.
- Host permissions cover Instagram, localhost, and `*.chatgpt.site`; another backend origin requires a manifest update.
