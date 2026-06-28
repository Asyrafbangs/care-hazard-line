import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARE Hazard Line",
  description: "Mobile-first hazard reporting system with WhatsApp-style flow and EHS action tracking.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#16803c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-safety-soft text-safety-ink antialiased">{children}</body>
    </html>
  );
}
