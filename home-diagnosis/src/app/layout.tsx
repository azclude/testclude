import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家づくり価値観診断",
  description: "注文住宅の価値観診断で、あなたに合った家づくりの方向性を見つけましょう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
