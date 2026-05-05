import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ReportPreviewProps {
  conteudo: string;
  formato: "md" | "txt";
}

export function ReportPreview({ conteudo, formato }: ReportPreviewProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
      <div className="border-b border-slate-800/50 p-4 flex items-center gap-3">
        <FileText className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-50">Preview do Relatório</h3>
      </div>
      
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {conteudo}
        </pre>
      </div>
    </Card>
  );
}
