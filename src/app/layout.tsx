import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Tracker",
  description: "Track opportunities, prep for interviews, and compare offers in one place.",
  appleWebApp: {
    capable: true,
    title: "Interview Tracker",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

// Deliberately NOT viewport-fit=cover: on iOS Safari it extends the page
// canvas behind the status bar and the bottom URL pill while sticky/fixed
// bars stay anchored to the safe layout viewport, so content bleeds out
// above the header and below the tab bar. With the default fit, Safari
// clips the page to the safe region and keeps fixed bars above its chrome.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcf9f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&display=swap"
        />
      </head>
      <body className="font-body antialiased min-h-screen animate-fade-in flex flex-col bg-vellum text-ink-900 selection:bg-terracotta/15 selection:text-terracotta-deep">
        {children}
        <footer className="mt-auto py-5 flex items-center justify-center gap-5 text-[10px] font-medium uppercase tracking-label text-ink-600">
          <a href="/faq" className="hover:text-terracotta transition-colors">FAQ</a>
          <span className="text-ink-400" aria-hidden="true">·</span>
          <a href="/privacy" className="hover:text-terracotta transition-colors">Privacy</a>
          <span className="text-ink-400" aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-terracotta transition-colors">Terms</a>
        </footer>
      </body>
    </html>
  );
}
