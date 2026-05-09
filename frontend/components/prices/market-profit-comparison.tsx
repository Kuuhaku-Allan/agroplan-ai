import { TrendingUp, TrendingDown, ArrowRight, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketProfitValidation } from "@/lib/types";

interface MarketProfitComparisonProps {
  lucroSistema: number;
  lucroMercado?: number;
  aplicado?: boolean;
  validacao?: MarketProfitValidation;
}

export function MarketProfitComparison({ 
  lucroSistema, 
  lucroMercado, 
  aplicado = false,
  validacao
}: MarketProfitComparisonProps) {
  if (lucroMercado === undefined || lucroMercado === null) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const diferenca = lucroMercado - lucroSistema;
  const diferencaPercent = lucroSistema !== 0 
    ? ((diferenca / Math.abs(lucroSistema)) * 100).toFixed(1)
    : "0";

  const getDiferencaColor = () => {
    const percentValue = Math.abs(parseFloat(diferencaPercent));
    if (percentValue > 50) return "text-amber-400";
    if (diferenca > 0) return "text-green-400";
    if (diferenca < 0) return "text-red-400";
    return "text-slate-400";
  };

  const getDiferencaIcon = () => {
    if (diferenca > 0) return <TrendingUp className="w-4 h-4" />;
    if (diferenca < 0) return <TrendingDown className="w-4 h-4" />;
    return <ArrowRight className="w-4 h-4" />;
  };

  const getLucroMercadoColor = () => {
    if (lucroMercado < 0) return "text-red-400";
    if (lucroMercado < lucroSistema * 0.5) return "text-amber-400";
    return "text-emerald-400";
  };

  const getConfiabilidadeConfig = (confiabilidade?: string) => {
    switch (confiabilidade) {
      case "alta":
        return {
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: "Alta"
        };
      case "media":
        return {
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          icon: <Info className="w-3 h-3" />,
          label: "Média"
        };
      case "baixa":
        return {
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          icon: <AlertTriangle className="w-3 h-3" />,
          label: "Baixa"
        };
      default:
        return null;
    }
  };

  const confiabilidadeConfig = validacao?.confiabilidade 
    ? getConfiabilidadeConfig(validacao.confiabilidade)
    : null;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-200">
            Comparação de Lucro
          </h3>
          <div className="flex items-center gap-2">
            {confiabilidadeConfig && (
              <Badge 
                variant="outline" 
                className={`${confiabilidadeConfig.bgColor} ${confiabilidadeConfig.color} ${confiabilidadeConfig.borderColor} flex items-center gap-1`}
              >
                {confiabilidadeConfig.icon}
                <span>{confiabilidadeConfig.label}</span>
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={aplicado 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-blue-500/10 text-blue-400 border-blue-500/30"
              }
            >
              {aplicado ? "Aplicado" : "Comparativo"}
            </Badge>
          </div>
        </div>

        {/* Lucros */}
        <div className="grid grid-cols-2 gap-3">
          {/* Lucro Sistema */}
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Lucro do Sistema</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(lucroSistema)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Base interna</div>
          </div>

          {/* Lucro Mercado */}
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Lucro de Mercado</div>
            <div className={`text-lg font-bold ${getLucroMercadoColor()}`}>
              {formatCurrency(lucroMercado)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Preço normalizado</div>
          </div>
        </div>

        {/* Diferença */}
        <div className="pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Diferença:</span>
            <div className={`flex items-center gap-1.5 font-semibold ${getDiferencaColor()}`}>
              {getDiferencaIcon()}
              <span>{formatCurrency(Math.abs(diferenca))}</span>
              <span className="text-xs">({diferencaPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Confiabilidade da Estimativa */}
        {validacao && confiabilidadeConfig && (
          <div className="pt-3 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 mb-2">Confiabilidade da estimativa:</div>
            <div className={`flex items-start gap-2 p-2 ${confiabilidadeConfig.bgColor} rounded text-xs ${confiabilidadeConfig.color}`}>
              {confiabilidadeConfig.icon}
              <div className="flex-1">
                <div className="font-medium mb-1">{confiabilidadeConfig.label}</div>
                {validacao.motivos && validacao.motivos.length > 0 && (
                  <ul className="space-y-0.5 text-slate-400">
                    {validacao.motivos.map((motivo, idx) => (
                      <li key={idx}>• {motivo}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aviso de baixa confiabilidade */}
        {validacao?.confiabilidade === "baixa" && (
          <div className="pt-2">
            <div className={`flex items-start gap-2 p-2 rounded text-xs ${
              validacao.critico 
                ? "bg-red-600/20 border border-red-600/40 text-red-300" 
                : "bg-red-500/10 text-red-400"
            }`}>
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                {validacao.critico && <strong>⚠️ VALOR CRÍTICO: </strong>}
                <strong>Este valor exige validação antes de ser usado na otimização.</strong> 
                {" "}Verifique produtividade, custos e unidade comercial.
              </span>
            </div>
          </div>
        )}

        {/* Aviso */}
        {!aplicado && (
          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded text-xs text-blue-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                Esta estimativa usa preços normalizados para R$/tonelada e serve apenas para comparação. 
                O lucro principal ainda utiliza a base interna do sistema.
              </span>
            </div>
          </div>
        )}

        {/* Aviso de prejuízo */}
        {lucroMercado < 0 && (
          <div className="pt-2">
            <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
              <TrendingDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                O preço de mercado atual resultaria em prejuízo para esta cultura neste talhão.
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
