"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  eyecatch?: { url: string };
  category?: { id: string; name: string };
  publishedAt?: string;
  createdAt: string;
  content: string;
};

type Category = {
  id: string;
  name: string;
};

const ITEMS_PER_PAGE = 10;

function BlogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const categoryParam = searchParams.get("category") || "";
    setSelectedCategory(categoryParam);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      const domain = process.env.NEXT_PUBLIC_SERVICE_DOMAIN;
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      if (!domain || !apiKey) return;

      try {
        const [blogsRes, categoriesRes] = await Promise.all([
          fetch(`https://${domain}.microcms.io/api/v1/blogs?limit=100`, {
            headers: { "X-MICROCMS-API-KEY": apiKey },
          }),
          fetch(
            `https://${domain}.microcms.io/api/v1/categories?orders=createdAt&limit=10`,
            {
              headers: { "X-MICROCMS-API-KEY": apiKey },
            },
          ),
        ]);

        if (!blogsRes.ok || !categoriesRes.ok)
          throw new Error("Failed to fetch data");

        const blogsData = await blogsRes.json();
        const categoriesData = await categoriesRes.json();

        setArticles(blogsData.contents);
        setCategories(categoriesData.contents);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesKeyword =
      article.title.toLowerCase().includes(keyword.toLowerCase()) ||
      article.content.toLowerCase().includes(keyword.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || article.category?.id === selectedCategory;

    return matchesKeyword && matchesCategory;
  });

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/?category=${val}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-10">
      <main className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* 左側：記事一覧エリア */}
          <div className="md:col-span-2 space-y-8">
            <div className="border-b pb-4 flex justify-end items-end">
              <span className="text-xs text-gray-400">
                全 {filteredArticles.length} 件
              </span>
            </div>

            {/* 検索・絞り込みフォーム */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="キーワードで検索..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-2/3 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-main-beige"
              />
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full sm:w-1/3 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-main-beige bg-white text-gray-600"
              >
                <option value="">すべてのカテゴリ</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-gray-500 text-center py-10">読み込み中...</p>
            ) : paginatedArticles.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                該当する記事が見つからなかったよ💦
              </p>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  {paginatedArticles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition"
                    >
                      {article.eyecatch && (
                        <img
                          src={article.eyecatch.url}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <span className="text-xs bg-main-beige text-gray-800 px-2 py-1 rounded">
                          {article.category?.name || "未分類"}
                        </span>
                        <h3 className="font-bold text-lg mt-2 text-gray-800 line-clamp-2">
                          <Link href={`/article/${article.id}`}>
                            {article.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(
                            article.publishedAt || article.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-100">
                    <button
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      &larr; 前へ
                    </button>
                    <span className="text-sm text-gray-500 font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      次へ &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右側（SPでは下部）：自己紹介エリア ＋ カテゴリ一覧 */}
          <aside className="md:col-span-1">
            {/* 💅 【リデザイン①】背景を bg-white に、枠線を細いグレー(border-gray-100)にして超クリーンに！ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24 border border-gray-100 space-y-10">
              {/* 自己紹介 */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  About Me
                </h2>
                <div className="flex flex-col items-center text-center">
                  {/* アバターの背景をちょっとトーンを落としたお砂場ベージュにして白背景に映えさせてみた！ */}
                  <div className="w-20 h-20 rounded-full bg-[#fdfbf7] border border-gray-100 shadow-sm flex items-center justify-center text-2xl mb-4">
                    🌱
                  </div>
                  <p className="font-bold text-gray-800">ユジン</p>

                  <div className="text-xs text-gray-600 mt-3 leading-relaxed text-left space-y-1">
                    <p>
                      コミュニティスペースの運営・学生のキャリアサポート・自社サービスのディレクター業をしてました。
                    </p>
                    <p>
                      アウトプットとして日常のぼやきからキャリアなど、自分の想いをのんびりと、気の向くままに綴っていきます。
                    </p>
                  </div>

                  {/* RSS feed */}
                  <Link
                    href="/feed.xml"
                    target="_blank"
                    className="mt-6 flex items-center gap-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6.503 20.752c0 1.1-.897 1.997-1.998 1.997C3.403 22.749 2.5 21.852 2.5 20.752c0-1.102.903-1.999 2.005-1.999 1.101 0 1.998.897 1.998 1.999zM2.5 10.638v3.427c4.793 0 8.694 3.903 8.694 8.685h3.43c0-6.68-5.438-12.112-12.124-12.112zm0-7.14v3.42c8.727 0 15.83 7.103 15.83 15.832h3.42C21.75 12.146 13.104 3.498 2.5 3.498z" />
                    </svg>
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      RSS Feed
                    </span>
                  </Link>
                </div>
              </div>

              {/* 💅 【リデザイン②】区切り線を「border-stone-200/80」にして、優しくもしっかり見えるように大修正！ */}
              <div className="border-t border-stone-200/80 pt-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4 text-center tracking-wider">
                  CATEGORY
                </h3>
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center">
                    カテゴリがまだないよ
                  </p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/?category=${cat.id}`}
                        /* 💅 【リデザイン③】背景が白になったから、選ばれてないボタンは上品な薄グレー(bg-stone-50)、
                           選ばれてるボタンはパキッと締まるシックな黒(bg-gray-850)にしてメリハリMAXに！ */
                        className={`text-xs px-3 py-1.5 rounded-full border shadow-sm transition ${
                          selectedCategory === cat.id
                            ? "bg-gray-850 text-white border-gray-850 font-medium scale-105"
                            : "bg-stone-50 text-gray-600 border-stone-200/60 hover:bg-stone-100/80"
                        }`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {selectedCategory && (
                      <Link
                        href="/"
                        className="text-[10px] text-gray-400 hover:text-gray-600 underline mt-4 block w-full text-center"
                      >
                        すべてのカテゴリに戻す
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <p className="text-gray-500 text-center py-20">読み込み中...</p>
      }
    >
      <BlogContent />
    </Suspense>
  );
}
