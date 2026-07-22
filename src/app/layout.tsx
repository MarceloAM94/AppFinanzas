import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "Control de gastos personales",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans">
        <Sidebar />
        <main className="min-h-screen md:ml-64">
          <div className="p-4 pt-16 md:p-6 md:pt-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
