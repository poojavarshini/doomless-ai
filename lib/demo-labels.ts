import { findDemoVideo } from "@/lib/demo-videos";

export function getDevelopmentDemoLabel(videoUrl?: string) {
  return findDemoVideo(videoUrl)?.label ?? null;
}
