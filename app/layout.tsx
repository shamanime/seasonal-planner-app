import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Seasonal Activity Calendar",
  description: "A customizable seasonal activity calendar for families everywhere.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        <header className="no-print mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-ink">
            Seasonal Activity Calendar
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {user ? (
              <>
                <Link href="/dashboard" className="rounded-full bg-white/70 px-4 py-2 shadow-sm hover:bg-white">
                  Dashboard
                </Link>
                <Link href="/admin" className="rounded-full bg-white/70 px-4 py-2 shadow-sm hover:bg-white">
                  Admin
                </Link>
              </>
            ) : (
              <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-white shadow-sm hover:bg-black">
                Sign in
              </Link>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
