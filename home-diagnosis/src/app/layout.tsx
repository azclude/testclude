import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家づくり価値観診断 | あなたにぴったりの家づくりを見つけよう",
  description: "たった5分の診断で、あなたの家づくりの価値観タイプ・おすすめ間取り・予算の目安がわかります。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-[#3e3a36] min-h-screen" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        <main className="max-w-lg mx-auto px-5 py-6 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
