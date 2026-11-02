import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Interview Tracker", template: "%s · Interview Tracker" },
  description: "Prep smarter, debrief faster, land the role. Track every opportunity, generate round-specific interview prep, and compare offers in one place.",
  appleWebApp: { capable: true, title: "Interview Tracker", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

// Deliberately not viewport-fit=cover: on iOS Safari it extends the page
// behind the status bar and the bottom URL pill, so pinned bars misalign.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcf9f4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.google.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&display=swap"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-vellum text-ink-900 selection:bg-terracotta/15 selection:text-terracotta-deep">
        {children}
      </body>
    </html>
  );
}
