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
  const labels = unique(
    Array.from(container.querySelectorAll<HTMLElement>("[aria-label]"))
      .map((element) => element.getAttribute("aria-label") ?? ""),
  ).slice(0, 60);
  const creatorLink = container.querySelector<HTMLAnchorElement>('a[href^="/"]:not([href*="/reel/"])');
  const creator = creatorLink?.textContent?.trim() || "Unknown creator";
  const caption = lines.find((line) => line.length > 25 && !/^\d+[KMB]?$/i.test(line)) ?? "";
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

export function findReelContainers(root: ParentNode = document): HTMLElement[] {
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video"));
  return uniqueElements(videos.map((video) => video.closest<HTMLElement>("article") ?? video.parentElement).filter(Boolean) as HTMLElement[]);
}

function uniqueElements(elements: HTMLElement[]) {
  return [...new Set(elements)];
}
