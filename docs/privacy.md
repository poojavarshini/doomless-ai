# Privacy statement

DoomLess is off by default. Until the user enables analysis or presses Analyze, it does not send Reel data to the backend.

When analysis runs, DoomLess may send the current Reel URL/identifier, creator name, caption, hashtags, visible text, accessibility labels, displayed duration, displayed engagement text, and locally selected relevance preferences. It does not intentionally collect passwords, direct messages, unrelated page history, cookies, or authentication tokens.

History, preferences, cache entries, and actions are stored in Chrome local storage on the current device. The MVP does not sync history to the backend. “Delete all DoomLess data” clears extension storage.

Automatic analysis is blocked when the page appears to identify private content. Screenshot and frame capture are not implemented. A future version must request an explicit, narrow browser permission at the moment of capture.

The backend logs Reel ID, evidence-source class, and latency for operations monitoring. It should not log captions or other content. Production deployments should define a short log-retention policy and a deletion contact before public release.
