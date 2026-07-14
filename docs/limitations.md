# Known limitations

- Instagram has no stable public DOM contract for Reels. Detection is defensive, but selectors may require updates.
- The MVP does not scrape video files, bypass access controls, call private Instagram APIs, or claim reliable transcript access.
- Caption-only analysis cannot assess actual visuals, audio, pacing, loops, factual accuracy, or delivery. Confidence and missing-information fields must reflect that.
- `isPrivate` detection is heuristic. Automatic analysis is blocked on a private-content signal, but users should avoid analyzing content they do not have permission to send.
- The first extension popup provides daily summary metrics, not the complete weekly dashboard requested for a later phase.
- The existing hosted demo uses an older seven-score web presentation. Migration to the shared 0–100 extension contract and six canonical fixtures is the next demo-polish task.
- “Replace with Better Content” records intent but does not yet fetch a replacement recommendation.
- “Show Less Like This” records the action; automatic preference learning is intentionally minimal in this first slice.
- Attention saved and useful seconds are transparent estimates, not scientific measurements.
- Host permissions currently cover localhost and `*.chatgpt.site`; a different backend origin requires a manifest change or a future optional-host permission flow.
