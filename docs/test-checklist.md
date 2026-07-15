# Manual extension test checklist

## Setup

- Build the extension and load `apps/extension/dist` from `chrome://extensions`.
- Start the local API with a server-side key, or use the clearly labeled extension demo mode.
- Confirm the backend URL is `http://localhost:3000` for local live analysis.

## Instagram flow

- [ ] Open Instagram desktop Reels and confirm Analyze appears without shifting the layout.
- [ ] Confirm no request occurs while analysis is disabled.
- [ ] Hover for less than 800 ms; confirm no analysis starts.
- [ ] Hover for at least 800 ms; confirm one loading state and one request.
- [ ] Enable active-visible analysis and confirm only the Reel at least 65% visible is scheduled.
- [ ] Revisit a Reel and confirm a schema-valid cached label appears without another API call.
- [ ] Verify the visible overlay contains only DoomLess AI, score, content type, one decision sentence, and minimize.
- [ ] Verify the overlay has no scrollbar, expandable sections, category bars, evidence copy, or raw errors.
- [ ] Minimize and restore the compact label using keyboard navigation.
- [ ] Open the popup; verify useful/skip count, average score, attention saved, useful consumed, exposure counts, and recent decisions.
- [ ] Change interests and confirm only Personal Relevance changes for a later analysis.

## Evidence and demo

- [ ] Analyze insufficient content; confirm `--/100`, `LIMITED ANALYSIS`, and `Not enough information to rate.`
- [ ] Enable Demo mode; confirm valid fixtures show one approved content label and deterministic decision line.
- [ ] Exercise all six demo scenarios, including positive entertainment and repetitive low-value content.

## Failure and privacy

- [ ] Stop the API and confirm a cached Reel still works.
- [ ] Analyze an uncached Reel offline and confirm the metadata fallback is explicit and low-confidence.
- [ ] Force a response beyond 15 seconds and confirm timeout handling.
- [ ] Return malformed JSON and confirm invalid-response handling.
- [ ] Confirm a private-content signal does not trigger automatic analysis.
- [ ] Delete all data and confirm settings, history, and cache clear.

## Accessibility

- [ ] Tab through all controls with visible focus.
- [ ] Confirm the score has a spoken “out of 100” label.
- [ ] Check high zoom and light/dark Instagram presentation.
- [ ] Confirm meaning is conveyed by labels and numbers, not color alone.
