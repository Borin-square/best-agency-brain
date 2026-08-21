import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Best Agency Brain",
  description: "Company brain for miglioreagenzia.it",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
