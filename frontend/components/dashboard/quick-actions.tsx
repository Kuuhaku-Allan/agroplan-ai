import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Ações Rápidas</h3>
      
      <div className="grid grid-cols-1 gap-3">
        <Link href="/genetico">
          <Button 
            variant="outline" 
            className="w-full justify-start border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <Dna className="w-4 h-4 mr-2" />
            Executar Algoritmo Genético
          </Button>
        </Link>

        <Link href="/validacao">
          <Button 
            variant="outline" 
            className="w-full justify-start border-blue-500/30 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Ver Validação Completa
          </Button>
        </Link>

        <Link href="/relatorios">
          <Button 
            variant="outline" 
            className="w-full justify-start border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </Link>
      </div>
    </Card>
  );
}
