import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { AppFrame } from "./components/AppFrame";

export const metadata: Metadata = {
  title: "Tuva – Teach to Learn",
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
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
