import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "우주소울 — 유기동물 커뮤니티",
  description: "유기동물과 사람을 잇는 따뜻한 커뮤니티, 우주소울",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "우주소울",
  },
};

export const viewport: Viewport = {
  themeColor: "#6B7C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="우주소울" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(reg) {
                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                            window.location.reload();
                          }
                        });
                      });
                    });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
