import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://slide-recipes-web.vercel.app"),
  title: "Slide Recipes — AI .pptx generator",
  description:
    "Turn a topic into a real .pptx. Model outline generation with editable PPTX rendering in your browser.",
  openGraph: {
    title: "Slide Recipes Web Studio",
    description:
      "主题 / 文案 → AI 大纲 → 浏览器本地生成可编辑 PPTX + Markdown。57 套色板、27 种版式，API Key 只留在内存。",
    siteName: "Slide Recipes Web Studio",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Slide Recipes Web Studio",
    description: "Editable PPTX + Markdown, generated in your browser.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ee",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
