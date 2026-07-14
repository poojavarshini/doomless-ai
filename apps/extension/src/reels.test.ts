import { describe, expect, it } from "vitest";
import { stableHash } from "./reels";
import { cacheKey, mergeHistory } from "./storage";
import type { HistoryRecord } from "@doomless/shared-types";

describe("Reel identity and cache", () => {
  it("creates deterministic metadata hashes", async () => {
    expect(await stableHash("Creator|Caption")).toBe(await stableHash(" creator|caption "));
    expect(await stableHash("Creator|Other")).not.toBe(await stableHash("Creator|Caption"));
  });

  it("uses a namespaced cache key", () => {
    expect(cacheKey("abc")).toBe("cache:abc");
  });

  it("deduplicates history by Reel id", () => {
    const record = { reelId: "abc", analyzedAt: "2026-01-01" } as HistoryRecord;
    expect(mergeHistory([record], { ...record, analyzedAt: "2026-01-02" })).toHaveLength(1);
    expect(mergeHistory([record], { ...record, analyzedAt: "2026-01-02" })[0]?.analyzedAt).toBe("2026-01-02");
  });
});
