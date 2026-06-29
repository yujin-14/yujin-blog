import "./globals.css";
import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";
// 💡 ①【追記】Next.js公式のアナリティクス機能をインポートするよ！
import { GoogleAnalytics } from "@next/third-parties/google";

const notoSerif = Noto_Serif_JP({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "日常の散文",
  description: "シンプルモダンな個人ブログ",
};

async function getCategories() {
  const domain = process.env.NEXT_PUBLIC_SERVICE_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!domain || !apiKey) return [];
  try {
    const res = await fetch(
      `https://${domain}.microcms.io/api/v1/categories?orders=createdAt&limit=10`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.contents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <html lang="ja">
      <body className="bg-[#fdfbf7] text-gray-800 antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between w-full">
            <Link
              href="/"
              className={`${notoSerif.className} text-xl md:text-2xl font-bold tracking-widest text-gray-855 hover:opacity-75 transition`}
            >
              日常の散文
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-gray-600 transition">
                Home
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.id}`}
                  className="hover:text-gray-600 transition"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="py-8 text-center text-xs text-gray-400 bg-white border-t border-gray-100">
          © 2026 日常の散文. All Rights Reserved.
        </footer>
      </body>
      {/* 💡 ②【追記】ここにさっきゲットした「G-から始まる測定ID」を直接貼り付ける！ */}
      {/* ※このIDは公開されても問題ないものだから、ここに直接書いちゃって100%安全だよ！👌 */}
      <GoogleAnalytics gaId="G-4V61HJX7LJ" />
    </html>
  );
}
