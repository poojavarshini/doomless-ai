import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { NutritionAnalysis, ReelMetadata } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { compactOverlayCss, toNutritionLabelResult } from "./compact";
import { NutritionPanel } from "./label-view";
import { buildMetadataFallback } from "./fallback";
import { extractReelMetadata, findReelContainers } from "./reels";
import { getSettings } from "./storage";

type Status = "idle" | "loading" | "ready" | "failed";
interface ApiResult { ok: boolean; analysis?: NutritionAnalysis | null; noData?: boolean; error?: string }
const mounted = new WeakSet<HTMLElement>();
const cleanup = new Map<HTMLElement, () => void>();
const visibilityObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
      entry.target.dispatchEvent(new CustomEvent("doomless:visible"));
    }
  }
}, { threshold: [0.65] });

function ReelNutritionLabel({ container }: { container: HTMLElement }) {
  const [status, setStatus] = useState<Status>("idle");
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [expanded, setExpanded] = useState(true);
  const label = toNutritionLabelResult(analysis, status === "failed" ? true : undefined);

  const analyze = useCallback(async () => {
    if (status === "loading" || status === "ready") return;
    setStatus("loading");
    let metadata: ReelMetadata | null = null;
    try {
      metadata = await extractReelMetadata(container);
      const result = await chromeApi.runtime.sendMessage({ type: "ANALYZE_REEL", metadata }) as ApiResult;
      if (!result.ok) throw new Error(result.error ?? "Analysis request failed.");
      if (result.noData || !result.analysis) {
        const settings = await getSettings();
        setAnalysis(buildMetadataFallback(metadata, settings.preferences, "Only the visible Reel surface was available."));
        setStatus("ready");
        return;
      }
      setAnalysis(result.analysis);
      setStatus("ready");
    } catch (error) {
      console.warn("DoomLess analysis unavailable", error);
      if (metadata && !metadata.isPrivate) {
        const settings = await getSettings();
        setAnalysis(buildMetadataFallback(metadata, settings.preferences, "The live analysis service was unavailable."));
        setStatus("ready");
      } else {
        setAnalysis(null);
        setStatus("failed");
      }
    }
  }, [container, status]);

  useEffect(() => {
    const listener = () => void analyze();
    container.addEventListener("doomless:analyze", listener);
    return () => container.removeEventListener("doomless:analyze", listener);
  }, [analyze, container]);

  useEffect(() => {
    if (status !== "idle") return;
    const rect = container.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const visibleRatio = visibleHeight / Math.max(1, rect.height);
    if (visibleRatio < 0.65) return;
    void getSettings().then((settings) => {
      if (settings.enabled && settings.analyzeVisible) void analyze();
    });
  }, [analyze, container, status]);

  return (
    <NutritionPanel
      label={label}
      expanded={expanded}
      logoUrl={chromeApi.runtime.getURL("icons/icon-48.png")}
      loading={status === "loading"}
      onToggle={() => setExpanded((value) => !value)}
    />
  );
}

function mount(container: HTMLElement) {
  if (mounted.has(container)) return;
  mounted.add(container);
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  const host = document.createElement("div");
  host.dataset.doomlessOverlay = "true";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = compactOverlayCss;
  shadow.append(style);
  const rootElement = document.createElement("div");
  shadow.append(rootElement);
  container.append(host);
  const updatePosition = () => {
    const rect = container.getBoundingClientRect();
    host.style.setProperty("--doomless-top", `${rect.top}px`);
    host.style.setProperty("--doomless-right", `${rect.right}px`);
  };
  updatePosition();
  document.documentElement.append(host);
  const root = createRoot(rootElement);
  root.render(<ReelNutritionLabel container={container} />);
  const requestAnalysis = () => container.dispatchEvent(new CustomEvent("doomless:analyze"));
  const visible = () => {
    void getSettings().then((settings) => {
      if (settings.enabled && settings.analyzeVisible) requestAnalysis();
    });
  };
  let hoverTimer: number | undefined;
  const enter = () => {
    hoverTimer = window.setTimeout(() => {
      void getSettings().then((settings) => {
        if (settings.enabled && settings.analyzeOnHover) requestAnalysis();
      });
    }, 800);
  };
  const leave = () => window.clearTimeout(hoverTimer);
  container.addEventListener("doomless:visible", visible);
  container.addEventListener("mouseenter", enter);
  container.addEventListener("mouseleave", leave);
  window.addEventListener("scroll", updatePosition, true);
  window.addEventListener("resize", updatePosition);
  const resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(container);
  visibilityObserver.observe(container);
  window.requestAnimationFrame(() => {
    const rect = container.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const visibleRatio = visibleHeight / Math.max(1, rect.height);
    if (visibleRatio >= 0.65) visible();
  });
  cleanup.set(container, () => {
    visibilityObserver.unobserve(container);
    resizeObserver.disconnect();
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("resize", updatePosition);
    container.removeEventListener("doomless:visible", visible);
    container.removeEventListener("mouseenter", enter);
    container.removeEventListener("mouseleave", leave);
    root.unmount();
    host.remove();
  });
}

function scan(root: ParentNode = document) {
  const containers = findReelContainers(root);
  containers.forEach(mount);
  if (containers.length > 0) {
    void chromeApi.storage.local.set({
      runtimeStatus: {
        lastSeenAt: new Date().toISOString(),
        url: location.href,
        reelContainersDetected: containers.length,
      },
    });
  }
}
scan();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (node instanceof HTMLElement) scan(node);
    }
  }
  for (const [container, dispose] of cleanup) {
    if (!container.isConnected) {
      dispose();
      cleanup.delete(container);
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
