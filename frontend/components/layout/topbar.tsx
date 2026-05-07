"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getHealth } from "@/lib/api";
import { ApiModeSelector } from "./api-mode-selector";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "loading">("loading");
  const [apiOrigin, setApiOrigin] = useState<"local" | "render" | undefined>(undefined);
  const [culturas, setCulturas] = useState<number | undefined>(undefined);
  const [talhoes, setTalhoes] = useState<number | undefined>(undefined);

  const carregarHealth = async () => {
    try {
      setApiStatus("loading");
      const health = await getHealth();
      setApiStatus("connected");
      setApiOrigin(health.api_origin);
      setCulturas(health.culturas);
      setTalhoes(health.talhoes);
    } catch (error) {
      console.error("Erro ao verificar saúde da API:", error);
      setApiStatus("disconnected");
      setApiOrigin(undefined);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      carregarHealth();
    }
  }, []);

  return (
    <div className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold text-slate-50">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {/* Seletor de API */}
          <ApiModeSelector 
            status={apiStatus}
            origin={apiOrigin}
            onRefresh={carregarHealth}
          />
          
          {culturas !== undefined && (
            <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">
              {culturas} culturas
            </Badge>
          )}
          
          {talhoes !== undefined && (
            <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">
              {talhoes} talhões
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
