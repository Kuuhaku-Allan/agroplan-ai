"use client";

import { Sidebar } from "./sidebar";
import { ReactNode } from "react";
import { useRenderKeepAlive } from "@/hooks/useRenderKeepAlive";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Ativar keep-alive se configurado
  useRenderKeepAlive();
  
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Gradiente de fundo */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 pointer-events-none" />
      
      {/* Layout */}
      <div className="relative flex">
        {!isLandingPage && <Sidebar />}
        
        <main className={isLandingPage ? "flex-1" : "flex-1 ml-64"}>
          {children}
        </main>
      </div>
    </div>
  );
}
