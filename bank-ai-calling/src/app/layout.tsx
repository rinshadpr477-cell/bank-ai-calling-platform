import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank AI Calling Platform | Enterprise Outbound Voice Automation",
  description: "Enterprise-grade AI-powered outbound voice automation for banks, financial services, and institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-[#f9f9ff] text-slate-900 selection:bg-[#004e9f]/10 selection:text-[#004e9f]">
        <SessionProviderWrapper>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              className: "font-sans text-sm",
              style: {
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
              },
            }}
          />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}