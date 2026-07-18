import { describe, expect, it } from "vitest";
import { buildUrlSurfaceAnalysis, isInstagramContentUrl } from "./surface-analysis";

describe("Instagram surface analysis", () => {
  it("recognizes Reel and post share links", () => {
    expect(isInstagramContentUrl("https://www.instagram.com/reel/DawLVAitqec/?igsh=abc")).toBe(true);
    expect(isInstagramContentUrl("https://www.instagram.com/p/Da0gxSdkeVQ/?utm_source=ig_web_copy_link")).toBe(true);
  });

  it("returns a complete neutral low-confidence label without inventing content", () => {
    const result = buildUrlSurfaceAnalysis("https://www.instagram.com/p/Da0gxSdkeVQ/?utm_source=ig_web_copy_link");
    expect(result.overallScore).toBe(50);
    expect(result.contentClassification.type).toBe("UNKNOWN");
    expect(result.recommendation.action).toBe("ANALYZE_MORE");
    expect(result.evidence.analysisMode).toBe("METADATA_ONLY");
    expect(result.evidence.confidence).toBe(5);
    expect(Object.values(result.categories).every((category) => category.score === 50)).toBe(true);
  });
});
