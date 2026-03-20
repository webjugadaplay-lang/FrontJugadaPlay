// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JugadaPlay - La emoción del deporte en tu bar",
  description: "Predice marcadores, gana dinero real. La mejor experiencia deportiva para bares y jugadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black`}>
        {children}
      </body>
    </html>
  );
}