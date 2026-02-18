import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Control de Asistencia",
  description: "Facultad de Derecho UNAM",
  manifest: "/manifest.json",
  themeColor: "#002147",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Asistencia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
