import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustNet | Digital Identity & Fraud Intelligence",
  description: "AI-Powered platform continuously evaluating digital trust.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-[var(--color-background)] text-[var(--color-text)] flex flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
