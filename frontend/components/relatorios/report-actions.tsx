"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, Check } from "lucide-react";

interface ReportActionsProps {
  conteudo: string;
  objetivo: string;
  formato: "md" | "txt";
  onRegenerate: () => void;
}

export function ReportActions({ conteudo, objetivo, formato, onRegenerate }: ReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(conteudo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_agroplan_${objetivo}.${formato}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Ações</h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex-1 border-slate-700 hover:bg-slate-800/50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-emerald-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Conteúdo
            </>
          )}
        </Button>

        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 border-slate-700 hover:bg-slate-800/50"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar Arquivo
        </Button>

        <Button
          onClick={onRegenerate}
          variant="outline"
          className="flex-1 border-slate-700 hover:bg-slate-800/50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Gerar Novamente
        </Button>
      </div>
    </Card>
  );
}
