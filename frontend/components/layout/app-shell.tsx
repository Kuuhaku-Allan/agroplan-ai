"use client";

import { Sidebar } from "./sidebar";
import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Gradiente de fundo */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 pointer-events-none" />
      
      {/* Layout */}
      <div className="relative flex">
        <Sidebar />
        
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
