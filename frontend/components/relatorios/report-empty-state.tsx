import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ReportEmptyState() {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-amber-500/10 rounded-full">
          <FileText className="w-12 h-12 text-amber-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-50 mb-2">
            Nenhum Relatório Gerado
          </h3>
          <p className="text-slate-400 max-w-md">
            Configure o objetivo e o formato desejado, depois clique em "Gerar Relatório" para criar seu documento explicável.
          </p>
        </div>
      </div>
    </Card>
  );
}
