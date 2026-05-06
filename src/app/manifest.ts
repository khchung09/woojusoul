import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우주소울",
    short_name: "우주소울",
    description: "유기동물과 사람을 잇는 따뜻한 커뮤니티",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    theme_color: "#2D5016",
    background_color: "#F8F4ED",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["social", "lifestyle"],
  };
}
