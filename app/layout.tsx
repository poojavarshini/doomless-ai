import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "doomless-ai-demo.poojavarshini1995.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;
  const title = "DoomLess AI — Digital Nutrition for Instagram Reels";
  const description =
    "Download the DoomLess AI Chrome beta and get an evidence-aware watch, save, skim, skip, or analyze-more decision for Instagram Reels.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-beta.png`, width: 1536, height: 1024, alt: "DoomLess AI Chrome beta digital nutrition label" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og-beta.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
