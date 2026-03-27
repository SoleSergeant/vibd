import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Vibd",
  description: "Real work, real proof, real opportunities."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen font-[var(--font-body)] text-slate-950 antialiased">
        <SiteHeader />
        {children}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
            <p className="font-medium text-slate-900">Vibd</p>
            <p>Work -&gt; Verified -&gt; Ranked -&gt; Hired</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
