import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaTools from "./pwa-tools";

export const metadata: Metadata = {
  title: {
    default: "SellerMate | Business Workspace",
    template: "%s | SellerMate"
  },
  applicationName: "SellerMate",
  description: "A simple business management app for small business owners.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SellerMate"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#116b4a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>
        {children}
        <PwaTools />
      </body>
    </html>
  );
}
