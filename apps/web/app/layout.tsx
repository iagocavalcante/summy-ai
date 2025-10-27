import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summ AI",
  description: "AI-powered summarization tool",
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
      </body>
    </html>
  );
}
