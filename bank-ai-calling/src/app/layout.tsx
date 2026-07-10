import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank AI Calling Platform",
  description: "AI-powered outbound calling for banks, insurers, and educational institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#F5F0E6",
              border: "1px solid rgba(186, 155, 95, 0.3)",
              color: "#132B23",
              fontFamily: "'Times New Roman', Times, serif",
            },
          }}
        />
      </body>
    </html>
  );
}