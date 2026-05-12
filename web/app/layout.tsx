import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "点将台 · Lead Station",
  description: "点将台：项目储备、时间轴、协作与版本记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="djt-font-force gant-canvas min-h-full flex flex-col text-[var(--gant-fore)]">
        {children}
      </body>
    </html>
  );
}
