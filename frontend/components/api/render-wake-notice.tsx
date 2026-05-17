"use client";

import { useState } from "react";
import { AlertCircle, ExternalLink, RefreshCw, Server } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

interface RenderWakeNoticeProps {
  onWakeAttempt?: () => void;
  onRetry?: () => void;
  onUseLocal?: () => void;
  className?: string;
}

export function RenderWakeNotice({
  onWakeAttempt,
  onRetry,
  onUseLocal,
  className = "",
}: RenderWakeNoticeProps) {
  const [isWaking, setIsWaking] = useState(false);

  const handleWakeRender = async () => {
    setIsWaking(true);
    
    try {
      // Chamar /health para acordar a API
      await fetch(API_ENDPOINTS.renderHealth, {
        cache: "no-store",
      });
      
      // Aguardar um pouco para dar tempo de acordar
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      if (onWakeAttempt) {
        onWakeAttempt();
      }
    } catch (error) {
      console.error("Erro ao tentar acordar Render:", error);
    } finally {
      setIsWaking(false);
    }
  };

  const handleOpenRender = () => {
    window.open(API_ENDPOINTS.renderHealth, "_blank");
  };

  return (
    <div
      className={`rounded-lg border border-amber-500/20 bg-slate-900/95 backdrop-blur-sm p-6 ${className}`}
    >
      {/* Ícone e Título */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            API Render pode estar dormindo
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            O Render Free pode levar cerca de 1 minuto para acordar após um
            período sem uso. Você pode aguardar, tentar acordar automaticamente
            ou abrir a API em outra aba.
          </p>
        </div>
      </div>

      {/* Link da API */}
      <div className="mb-4 p-3 rounded-md bg-slate-800/50 border border-slate-700/50">
        <p className="text-xs text-slate-500 mb-1">URL da API Render:</p>
        <a
          href={API_ENDPOINTS.renderHealth}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:text-cyan-300 font-mono break-all flex items-center gap-1"
        >
          {API_ENDPOINTS.renderHealth}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Acordar API Render */}
        <button
          onClick={handleWakeRender}
          disabled={isWaking}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${isWaking ? "animate-spin" : ""}`}
          />
          <span className="text-sm font-medium">
            {isWaking ? "Acordando..." : "Acordar API Render"}
          </span>
        </button>

        {/* Abrir API Render */}
        <button
          onClick={handleOpenRender}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-medium">Abrir API Render</span>
        </button>

        {/* Tentar Novamente */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Tentar Novamente</span>
          </button>
        )}

        {/* Usar API Local */}
        {onUseLocal && (
          <button
            onClick={onUseLocal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
          >
            <Server className="w-4 h-4" />
            <span className="text-sm font-medium">Usar API Local</span>
          </button>
        )}
      </div>

      {/* Nota Informativa */}
      <div className="mt-4 p-3 rounded-md bg-slate-800/30 border border-slate-700/30">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-400">Nota:</strong> No plano Free do
          Render, a API dorme automaticamente após ~15 minutos sem tráfego.
          Isso é normal e esperado.
        </p>
      </div>
    </div>
  );
}
