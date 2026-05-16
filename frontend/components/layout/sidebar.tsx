"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Dna,
  CheckCircle2,
  FileText,
  Scale,
  Info,
  CalendarDays,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planejamento", label: "Planejamento", icon: CalendarDays },
  { href: "/talhoes", label: "Talhões", icon: MapPin },
  { href: "/cenarios", label: "Cenários", icon: Layers },
  { href: "/genetico", label: "Algoritmo Genético", icon: Dna },
  { href: "/validacao", label: "Validação", icon: CheckCircle2 },
  { href: "/comparacao-mercado", label: "Comparação Mercado", icon: Scale },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/sobre", label: "Sobre", icon: Info },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/50">
        <h1 className="text-2xl font-bold text-emerald-500">AgroPlan AI</h1>
        <p className="text-sm text-slate-400 mt-1">Decisão agrícola inteligente</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50">
        <p className="text-xs text-slate-500 text-center">
          AgroPlan AI v5.0
        </p>
      </div>
    </aside>
  );
}
