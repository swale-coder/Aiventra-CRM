import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CrmDataProvider } from "@/lib/data/CrmDataProvider";

export const metadata: Metadata = {
  title: "Aiventra AI CRM — Build. Sell. Predict.",
  description: "Premium AI-powered CRM for real estate builders. Aiventra AI — Build. Sell. Predict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`:root{--font-display:'Manrope',sans-serif;--font-sans:'Inter',sans-serif;--font-mono:'IBM Plex Mono',monospace;}`}</style>
      </head>
      <body>
        <AuthProvider>
          <CrmDataProvider>{children}</CrmDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
