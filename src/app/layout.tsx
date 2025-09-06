import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Bebas_Neue } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });

export const metadata: Metadata = {
  title: "Player Profile",
  description: "Modern player profile and dashboard",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#26A84A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <head>
        <link rel="stylesheet" href="/tw.css" />
      </head>
      <body className="bg-[var(--bg)] text-[var(--fg)] antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
        <footer className="mt-12 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Player Profile</span>
            <nav className="flex items-center gap-4">
              <Link className="hover:underline" href="/blog">Blog</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}