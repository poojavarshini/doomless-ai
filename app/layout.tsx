import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoomLess AI",
  description: "A digital wellbeing nutrition label for short-form video.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
