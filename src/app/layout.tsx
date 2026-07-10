import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Association Election — College Voting System",
  description:
    "Secure, lightweight voting system for college association elections. Secure Votes. Fair Leadership.",
  keywords: ["voting", "election", "college", "association"],
  robots: "noindex, nofollow", // Private election system
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-950 antialiased transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "white",
                border: "1px solid #E2E8F0",
                color: "#1A1A1A",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
