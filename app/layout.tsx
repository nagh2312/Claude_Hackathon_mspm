import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { isGoogleAuthConfigured } from "@/lib/auth/options";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reflection Journal",
  description: "Capture → understand → fork → nurture → reflect. Not clinical care.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleAuthEnabled = isGoogleAuthConfigured();
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <AppProviders googleAuthEnabled={googleAuthEnabled}>{children}</AppProviders>
      </body>
    </html>
  );
}
