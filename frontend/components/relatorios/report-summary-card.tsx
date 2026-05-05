import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Target, FileType } from "lucide-react";

interface ReportSummaryCardProps {
  objetivo: string;
  formato: string;
  caminho: string;
  tamanho?: number;
}

export function ReportSummaryCard({ objetivo, formato, caminho, tamanho }: ReportSummaryCardProps) {
  const objetivoLabel = {
    equilibrado: "Equilibrado",
    lucro: "Máximo Lucro",
    risco: "Baixo Risco",
    sustentavel: "Sustentável"
  }[objetivo] || objetivo;

  const formatoLabel = formato === "md" ? "Markdown" : "Texto";
  const extensao = formato === "md" ? ".md" : ".txt";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status */}
      <Card className="bg-slate-900/50 border-emerald-500/20 p-5">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-400">Status</span>
        </div>
        <p className="text-lg font-semibold text-emerald-500">Gerado com sucesso</p>
      </Card>

      {/* Objetivo */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Objetivo</span>
        </div>
        <p className="text-lg font-semibold text-slate-50">{objetivoLabel}</p>
      </Card>

      {/* Formato */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <FileType className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Formato</span>
        </div>
        <p className="text-lg font-semibold text-slate-50">
          {formatoLabel} {extensao}
        </p>
      </Card>

      {/* Tamanho */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Tamanho</span>
        </div>
        <p className="text-lg font-semibold text-slate-50">
          {tamanho ? `${(tamanho / 1024).toFixed(1)} KB` : "N/A"}
        </p>
      </Card>
    </div>
  );
}
