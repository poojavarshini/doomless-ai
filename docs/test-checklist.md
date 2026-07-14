# Manual extension test checklist

## Setup

- Build the extension and load `apps/extension/dist` from `chrome://extensions`.
- Start the local API with a server-side key.
- Confirm extension settings point to `http://localhost:3000`.

## Instagram flow

- [ ] Open Instagram desktop and navigate to Reels.
- [ ] Confirm an Analyze button appears on a Reel without shifting Instagram layout.
- [ ] Confirm no request occurs while analysis is disabled.
- [ ] Enable analysis and hover for less than 800 ms; confirm no analysis starts.
- [ ] Hover for at least 800 ms; confirm one loading state and one request.
- [ ] Scroll until a new Reel is at least 65% visible; confirm active analysis only when that trigger is enabled.
- [ ] Revisit the first Reel; confirm the cached label appears without a second API call.
- [ ] Expand the label using keyboard navigation; verify all seven reasons, confidence, source, missing data, and attention estimate.
- [ ] Use Watch, Skip, Save useful, Show less, and Replace; verify the action is retained in local history.
- [ ] Open the popup; verify analyzed count, average score, attention-saved estimate, and recent history.
- [ ] Open preferences; change interests and verify a later analysis sends the updated relevance profile.

## Failure and privacy

- [ ] Stop the API and confirm a cached Reel still works.
- [ ] Analyze an uncached Reel offline and confirm a retryable error.
- [ ] Force a response beyond 15 seconds and confirm timeout copy.
- [ ] Return malformed JSON and confirm invalid-response copy.
- [ ] Confirm a private-content signal does not trigger automatic analysis.
- [ ] Delete all data and confirm settings, history, and cache clear.

## Accessibility

- [ ] Tab through all controls with visible focus.
- [ ] Confirm the score has a spoken “out of 100” label.
- [ ] Check high zoom and both light/dark Instagram presentation.
- [ ] Confirm meaning is conveyed by labels and numbers, not color alone.
