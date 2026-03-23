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
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
