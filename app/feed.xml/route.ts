import { NextResponse } from "next/server";

// 1時間に1回データを再取得する（ISRみたいな設定）
export const revalidate = 3600;

type Article = {
  id: string;
  title: string;
  publishedAt?: string;
  createdAt: string;
};

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_SERVICE_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  // ※ブログのURL（本番環境のドメイン）に書き換えてね！
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://あなたの本番ドメイン.com";

  if (!domain || !apiKey) {
    return new NextResponse("Env settings error", { status: 500 });
  }

  try {
    // microCMSから最新の記事を最大50件取得
    const res = await fetch(
      `https://${domain}.microcms.io/api/v1/blogs?limit=50&orders=-publishedAt`,
      {
        headers: { "X-MICROCMS-API-KEY": apiKey },
      },
    );

    if (!res.ok) throw new Error("Failed to fetch articles");

    const data = await res.json();
    const articles: Article[] = data.contents;

    // RSSのアイテム部分をXMLで組み立てる
    const rssItems = articles
      .map((article) => {
        const date = article.publishedAt || article.createdAt;
        return `
        <item>
          <title><![CDATA[${article.title}]]></title>
          <link>${baseUrl}/article/${article.id}</link>
          <guid>${baseUrl}/article/${article.id}</guid>
          <pubDate>${new Date(date).toUTCString()}</pubDate>
        </item>
      `;
      })
      .join("");

    // RSS全体のXML構造を作成
    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>日常の散文</title>
    <link>${baseUrl}</link>
    <description>ユジンがのんびりと気の向くままに綴るブログ</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

    // XMLとしてブラウザ（やRSSリーダー）に返す
    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("RSS Feed Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
