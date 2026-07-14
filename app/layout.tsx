import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OM-Eat",
  description:
    "Reference guide to what to eat on a turnaround, maintained by BA Euroflyer crew at London Gatwick.",
};

// Follow the device theme before first paint; tokens live under
// [data-theme="dark"] in globals.css.
const themeScript = `if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.setAttribute("data-theme","dark");`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <nav className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3 font-mono text-sm font-semibold">
            <Link href="/" className="font-mono font-bold text-ink no-underline">
              OM-Eat
            </Link>
            <span className="flex gap-4">
              <Link href="/destinations" className="text-accent no-underline">
                Destinations
              </Link>
              <Link href="/add" className="text-accent no-underline">
                Add a Find
              </Link>
            </span>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
