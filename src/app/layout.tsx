import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Tracker",
  description: "Personal job search management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen animate-fade-in flex flex-col">
        {children}
        <footer className="mt-auto py-4 border-t border-warm-300/40 text-center">
          
            href="/faq"
            className="text-xs text-warm-400 hover:text-warm-600 transition-colors"
          >
            FAQ
          </a>
        </footer>
      </body>
    </html>
  );
}
