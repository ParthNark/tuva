import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuva – Learning Tutor",
  description: "An AI tutor that learns from you through camera and voice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0d0d14] text-slate-100">
        {children}
      </body>
    </html>
  );
}
