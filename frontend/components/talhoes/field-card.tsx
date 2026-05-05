import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Droplets, Mountain, Thermometer, Layers, Sprout, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrencyCompactBRL } from "@/lib/formatters";

interface FieldCardProps {
  talhao: {
    id: number;
    area: number;
    solo: string;
    clima: string;
    relevo: string;
    agua: string;
    cultura?: string;
    lucro_estimado?: number;
    risco?: number;
    nota?: number;
  };
  onClick?: () => void;
}

export function FieldCard({ talhao, onClick }: FieldCardProps) {
  const getSoloBadgeColor = (solo: string) => {
    const colors: Record<string, string> = {
      argiloso: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      arenoso: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
      misto: "border-green-500/30 bg-green-500/10 text-green-500",
      siltoso: "border-slate-500/30 bg-slate-500/10 text-slate-400"
    };
    return colors[solo.toLowerCase()] || "border-slate-500/30 bg-slate-500/10 text-slate-400";
  };

  const getClimaBadgeColor = (clima: string) => {
    const colors: Record<string, string> = {
      quente: "border-red-500/30 bg-red-500/10 text-red-500",
      ameno: "border-green-500/30 bg-green-500/10 text-green-500",
      frio: "border-blue-500/30 bg-blue-500/10 text-blue-500"
    };
    return colors[clima.toLowerCase()] || "border-slate-500/30 bg-slate-500/10 text-slate-400";
  };

  const getAguaBadgeColor = (agua: string) => {
    const colors: Record<string, string> = {
      baixa: "border-red-500/30 bg-red-500/10 text-red-500",
      media: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      alta: "border-blue-500/30 bg-blue-500/10 text-blue-500"
    };
    return colors[agua.toLowerCase()] || "border-slate-500/30 bg-slate-500/10 text-slate-400";
  };

  const getRiscoBadgeColor = (risco: number) => {
    if (risco < 25) return "border-green-500/30 bg-green-500/10 text-green-500";
    if (risco < 40) return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    return "border-red-500/30 bg-red-500/10 text-red-500";
  };

  const getCompatibilidadeColor = (nota: number) => {
    if (nota >= 75) return "bg-green-500";
    if (nota >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const compatibilidade = Math.min(100, talhao.nota || 0);

  return (
    <Card 
      className="bg-slate-900/50 border-slate-800/50 p-5 hover:border-emerald-500/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <MapPin className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Talhão {talhao.id}</h3>
            <p className="text-sm text-slate-400">{talhao.area} hectares</p>
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Solo:</span>
          <Badge variant="outline" className={getSoloBadgeColor(talhao.solo)}>
            {talhao.solo.charAt(0).toUpperCase() + talhao.solo.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Clima:</span>
          <Badge variant="outline" className={getClimaBadgeColor(talhao.clima)}>
            {talhao.clima.charAt(0).toUpperCase() + talhao.clima.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Relevo:</span>
          <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">
            {talhao.relevo.charAt(0).toUpperCase() + talhao.relevo.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Água:</span>
          <Badge variant="outline" className={getAguaBadgeColor(talhao.agua)}>
            {talhao.agua.charAt(0).toUpperCase() + talhao.agua.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Recomendação */}
      {talhao.cultura && (
        <>
          <div className="border-t border-slate-800/50 pt-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-300">Cultura Recomendada</span>
            </div>
            <p className="text-lg font-bold text-emerald-500 mb-3">
              {talhao.cultura.toUpperCase()}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1 text-slate-400 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Lucro</span>
                </div>
                <p className="font-semibold text-slate-200">
                  {talhao.lucro_estimado ? formatCurrencyCompactBRL(talhao.lucro_estimado) : "N/A"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-slate-400 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Risco</span>
                </div>
                <Badge variant="outline" className={talhao.risco ? getRiscoBadgeColor(talhao.risco) : ""}>
                  {talhao.risco ? `${talhao.risco}%` : "N/A"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Barra de Compatibilidade */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Compatibilidade</span>
              <span className="font-semibold">{compatibilidade.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getCompatibilidadeColor(compatibilidade)} transition-all`}
                style={{ width: `${compatibilidade}%` }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
