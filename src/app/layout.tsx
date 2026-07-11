import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegistroSW from "@/components/RegistroSW";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PratoScan",
  description: "Fotografe seu prato e acompanhe suas calorias",
  applicationName: "PratoScan",
  // iOS não usa o manifest: estas tags fazem o "Adicionar à Tela de Início"
  // do Safari abrir em tela cheia com a status bar integrada ao tema escuro
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PratoScan",
  },
};

// maximumScale/userScalable travados para a experiência parecer app nativo
// (evita zoom acidental ao tocar em inputs no iOS)
export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RegistroSW />
        {children}
      </body>
    </html>
  );
}
