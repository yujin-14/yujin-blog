import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 👈 これ！すべてのページをHTMLとして書き出す設定だよ！
  images: {
    unoptimized: true, // 👈 静的エクスポートの時はNext.js特有の画像最適化が使えないから、これをtrueにするルールなの。microCMSの画像をそのまま使うから全く問題ナシ！
  },
};

export default nextConfig;
