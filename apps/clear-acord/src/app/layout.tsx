import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Clear ACORD Forms",
  description: "ACORD insurance form library — fill and generate PDFs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
