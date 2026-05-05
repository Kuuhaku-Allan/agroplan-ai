import { Card } from "@/components/ui/card";
import { MapPin, Maximize2, Layers, Sprout, AlertTriangle, TrendingUp } from "lucide-react";

interface FieldSummaryCardsProps {
  totalTalhoes: number;
  areaTotal: number;
  soloMaisComum: string;
  culturaMaisRecomendada: string;
  riscoMedio: number;
  diversidade: number;
}

export function FieldSummaryCards({
  totalTalhoes,
  areaTotal,
  soloMaisComum,
  culturaMaisRecomendada,
  riscoMedio,
  diversidade
}: FieldSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-400">Total de Talhões</span>
        </div>
        <p className="text-2xl font-bold text-slate-50">{totalTalhoes}</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Maximize2 className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-slate-400">Área Total</span>
        </div>
        <p className="text-2xl font-bold text-slate-50">{areaTotal} ha</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium text-slate-400">Solo Mais Comum</span>
        </div>
        <p className="text-2xl font-bold text-slate-50 capitalize">{soloMaisComum}</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Sprout className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-slate-400">Cultura Principal</span>
        </div>
        <p className="text-2xl font-bold text-slate-50 capitalize">{culturaMaisRecomendada}</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-slate-400">Risco Médio</span>
        </div>
        <p className="text-2xl font-bold text-slate-50">{riscoMedio.toFixed(1)}%</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-400">Diversidade</span>
        </div>
        <p className="text-2xl font-bold text-slate-50">{diversidade} culturas</p>
      </Card>
    </div>
  );
}
