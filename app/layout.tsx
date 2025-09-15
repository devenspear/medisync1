import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StillCaster - AI-Powered Meditation Platform",
  description: "Personalized binaural beat meditation with AI-generated scripts and voice guidance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="font-system antialiased bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white safe-area-container">
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
