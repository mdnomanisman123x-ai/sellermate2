import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SellerMate — Your Smart Business Partner",
  description: "A simple business workspace for small business owners."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
