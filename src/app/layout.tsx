import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Toolbar from "../components/Toolbar";
import AuthProvider from "@/components/auth/AuthProvider";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});


export const metadata: Metadata = {
  title: "SportsPulse - Indian Sports News, Results, Schedules & Data",
  description: "Get the latest Indian sports news, live results, schedules, athlete stats, and in-depth data for Badminton, Table Tennis, Archery, Shooting, and more.",
  openGraph: {
    title: "SportsPulse - Indian Sports News, Results, Schedules & Data",
    description: "Get the latest Indian sports news, live results, schedules, athlete stats, and in-depth data for Badminton, Table Tennis, Archery, Shooting, and more.",
    images: [
      {
        url: "https://sportzpulse.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "SportsPulse Open Graph Image"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "SportsPulse - Indian Sports News, Results, Schedules & Data",
    description: "Get the latest Indian sports news, live results, tournament schedules, athlete stats, and in-depth data for Badminton, Table Tennis, Archery, Shooting, and more.",
    images: ["https://sportzpulse.com/og-image.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://sportzpulse.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <Toolbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
