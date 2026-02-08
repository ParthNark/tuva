import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { AppFrame } from "./components/AppFrame";
import { ThemeProvider } from "./components/ThemeProvider";
import { DarkVeilBackground } from "./components/DarkVeilBackground";

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
      <body className="min-h-screen antialiased relative overflow-x-hidden">
        <ThemeProvider>
          <DarkVeilBackground />
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
