import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

type Toc = { id: string; text: string; tag: string };

async function getArticle(id: string) {
  const domain = process.env.NEXT_PUBLIC_SERVICE_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const res = await fetch(`https://${domain}.microcms.io/api/v1/blogs/${id}`, {
    headers: { "X-MICROCMS-API-KEY": apiKey || "" },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

// ▼ 【重要】作戦A（静的エクスポート）のために、あらかじめ存在する記事IDをNext.jsに教えるよ！🚀
export async function generateStaticParams() {
  const domain = process.env.NEXT_PUBLIC_SERVICE_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!domain || !apiKey) return [];

  const res = await fetch(
    `https://${domain}.microcms.io/api/v1/blogs?limit=100`,
    {
      headers: { "X-MICROCMS-API-KEY": apiKey },
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.contents.map((article: any) => ({
    id: article.id,
  }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article)
    return <p className="text-center py-20">記事が見つからなかったよ💦</p>;

  // --- 目次生成ロジック ---
  const toc: Toc[] = [];
  const body = article.content;
  const headings = body.match(/<(h2|h3)[^>]*>.*?<\/\1>/g) || [];

  let processedContent = body;
  headings.forEach((heading: string, index: number) => {
    const tag = heading.match(/<(h2|h3)/)?.[1] || "";
    const text = heading.replace(/<[^>]*>/g, "");
    const idName = `heading-${index}`;
    toc.push({ id: idName, text, tag });

    const replacedHeading = heading.replace(/^<(h2|h3)/, `<$1 id="${idName}"`);
    processedContent = processedContent.replace(heading, replacedHeading);
  });

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12 md:py-20">
      <article className="max-w-3xl mx-auto px-4">
        <header className="mb-12 text-center">
          <p className="text-sm font-bold text-amber-600 mb-4 tracking-widest uppercase">
            {article.category?.name || "未分類"}
          </p>
          <h1
            className={`${notoSerif.className} text-3xl md:text-4xl leading-tight text-gray-900 mb-6`}
          >
            {article.title}
          </h1>
          <time className="text-sm text-gray-400">
            {new Date(
              article.publishedAt || article.createdAt,
            ).toLocaleDateString("ja-JP")}
          </time>
        </header>

        {article.eyecatch && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-sm bg-white">
            <img
              src={article.eyecatch.url}
              alt={article.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {toc.length > 0 && (
          <nav className="mb-12 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-800 font-bold mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <span>目次</span>
            </p>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={`text-sm ${item.tag === "h3" ? "ml-5 text-gray-500" : "text-gray-700 font-medium"}`}
                >
                  <a
                    href={`#${item.id}`}
                    className="hover:text-amber-600 hover:underline transition"
                  >
                    ・ {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div
          className="prose prose-amber max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-amber-100 prose-h2:pb-2 prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-img:rounded-xl prose-img:shadow-sm"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        <div className="mt-16 pt-8 border-t border-gray-100 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-gray-400 hover:text-amber-600 transition"
          >
            &larr; 記事一覧に戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
