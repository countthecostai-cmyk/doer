import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SkipLink } from "@/components/SkipLink";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doer.done.app";
const title = "Done Doer — Find work nearby";
const description =
  "The Doer app for Done, a local on-demand task marketplace. Browse open tasks, claim jobs, and get paid.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Done Doer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <SkipLink />
        <Nav />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
