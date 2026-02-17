import type { Metadata } from "next";
import { Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import "./globals.css";
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
export const metadata: Metadata = {
  title: "Sistema de Asistencia — Sucesiones",
  description: "Sistema de asistencia para la clase de Sucesiones, Facultad de Derecho, UNAM",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${libreBaskerville.variable} ${jetbrainsMono.variable} font-serif antialiased`}>
        {children}
      </body>
    </html>
  );
}
