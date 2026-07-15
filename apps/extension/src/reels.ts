import type { ReelMetadata } from "@doomless/shared-types";

export async function stableHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export async function extractReelMetadata(container: HTMLElement): Promise<ReelMetadata> {
  const link = container.querySelector<HTMLAnchorElement>('a[href*="/reel/"]');
  const url = link ? new URL(link.href, location.origin).href : location.href;
  const text = container.innerText?.trim() ?? "";
  const lines = unique(text.split("\n")).slice(0, 60);
  const labels = unique([
    ...Array.from(container.querySelectorAll<HTMLElement>("[aria-label]"))
      .map((element) => element.getAttribute("aria-label") ?? ""),
    ...Array.from(container.querySelectorAll<HTMLImageElement>("img[alt]"))
      .map((element) => element.alt),
  ]).slice(0, 60);
  const creatorLink = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'))
    .find((anchor) => /^\/[A-Za-z0-9._]+\/?(?:\?|$)/.test(anchor.getAttribute("href") ?? "") && !/^\/(reel|reels|explore|direct|accounts)\b/.test(anchor.getAttribute("href") ?? ""));
  const creator = creatorLink?.textContent?.trim() || "Unknown creator";
  const pageDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ?? "";
  const describedCaption = pageDescription.match(/[“\"](.{20,2000})[”\"]/)?.[1] ?? "";
  const captionCandidates = unique([describedCaption, ...lines])
    .filter((line) => line.length > 20 && !isInstagramUiText(line, creator));
  const caption = captionCandidates.sort((a, b) => b.length - a.length)[0]?.slice(0, 8_000) ?? "";
  const hashtags = unique((`${caption} ${text}`.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((tag) => tag.slice(1)));
  const video = container.querySelector<HTMLVideoElement>("video");
  const durationSeconds = video && Number.isFinite(video.duration) ? Math.round(video.duration) : undefined;
  const pathId = new URL(url).pathname.match(/\/reel\/([^/]+)/)?.[1];
  const reelId = pathId ?? await stableHash([url, creator, caption].join("|"));
  const available = [caption && "caption", labels.length && "accessibility labels", lines.length && "visible text", durationSeconds && "duration"].filter(Boolean);

  return {
    reelId,
    url,
    creator,
    caption,
    hashtags,
    visibleText: lines,
    accessibilityLabels: labels,
    durationSeconds,
    engagementText: lines.filter((line) => /\b(likes?|comments?|views?)\b/i.test(line)).slice(0, 20),
    isPrivate: /private account|follow to see/i.test(text),
    source: "partial",
    missingInformation: [
      ...(!caption ? ["caption"] : []),
      ...(!durationSeconds ? ["reliable duration"] : []),
      "transcript or audio",
      "video frames",
      ...(available.length ? [] : ["usable Reel metadata"]),
    ],
  };
}

function isInstagramUiText(value: string, creator: string) {
  const compact = value.trim();
  if (compact === creator || /^\d+(?:[.,]\d+)?[KMB]?$/i.test(compact)) return true;
  return /^(follow|following|like|comment|share|save|more|original audio|see translation|suggested for you)$/i.test(compact);
}

export function findReelContainers(root: ParentNode = document): HTMLElement[] {
  const self = root instanceof HTMLVideoElement ? [root] : [];
  const videos = [...self, ...Array.from(root.querySelectorAll<HTMLVideoElement>("video"))];
  return uniqueElements(videos.map(findBestContainer).filter(Boolean) as HTMLElement[]);
}

function findBestContainer(video: HTMLVideoElement): HTMLElement | null {
  let current = video.parentElement;
  let best = current;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let depth = 0; current && depth < 12; depth += 1, current = current.parentElement) {
    const rect = current.getBoundingClientRect();
    const videoCount = current.querySelectorAll("video").length;
    const textLength = (current.innerText ?? "").trim().length;
    const isReasonableReelSurface = rect.width >= 280
      && rect.height >= 360
      && rect.width <= Math.max(1_100, window.innerWidth)
      && rect.height <= window.innerHeight * 1.8
      && videoCount <= 1;
    if (isReasonableReelSurface) {
      const score = Math.min(80, textLength / 4)
        + (current.matches("article, [role='dialog']") ? 140 : 0)
        + (current.querySelector('a[href*="/reel/"]') ? 90 : 0)
        + (current.querySelector("[aria-label], img[alt]") ? 20 : 0)
        - depth;
      if (score > bestScore) {
        best = current;
        bestScore = score;
      }
    }
    if (current === document.body) break;
  }
  return best;
}

function uniqueElements(elements: HTMLElement[]) {
  return [...new Set(elements)];
}
