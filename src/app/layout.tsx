import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Admin Dashboard",
  description: "Modern SaaS Product Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#f4f6fa] text-slate-800 flex flex-col md:flex-row overflow-x-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
