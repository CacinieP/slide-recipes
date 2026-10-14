import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slide Recipes — AI .pptx generator",
  description:
    "Turn a topic into a real .pptx. Model outline generation with editable PPTX rendering in your browser.",
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
