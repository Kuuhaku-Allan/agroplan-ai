import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdvancedModeProvider } from "@/context/AdvancedModeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AgroPlan AI - Sistema Inteligente de Planejamento de Plantio",
  description: "Otimização agrícola com Algoritmo Genético",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>
          <AdvancedModeProvider>
            <AppShell>{children}</AppShell>
          </AdvancedModeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
