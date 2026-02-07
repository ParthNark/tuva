import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Cargo – Teach to Learn",
  description: "An AI tutor that learns from you through camera and voice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
