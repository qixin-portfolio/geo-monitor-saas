import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Monitor",
  description: "监测你的品牌是否正在被 AI 推荐。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
