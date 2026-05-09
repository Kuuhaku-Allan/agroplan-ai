import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketProfitValidationSummary } from "@/lib/types";

interface MarketProfitValidationBannerProps {
  validacao: MarketProfitValidationSummary;
}

export function MarketProfitValidationBanner({ validacao }: MarketProfitValidationBannerProps) {
  if (!validacao.ativo) {
    return null;
  }

  const total = validacao.total_itens || 0;
  const alta = validacao.itens_alta_confiabilidade || 0;
  const media = validacao.itens_media_confiabilidade || 0;
  const baixa = validacao.itens_baixa_confiabilidade || 0;
  const percBaixa = validacao.percentual_baixa_confiabilidade || 0;
  const percAlta = validacao.percentual_alta_confiabilidade || 0;

  // Determinar cor e ícone baseado na confiabilidade geral
  const getStatusConfig = () => {
    if (percBaixa >= 30) {
      return {
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "Atenção: Validação de Lucro de Mercado"
      };
    } else if (percAlta >= 70) {
      return {
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: <CheckCircle2 className="w-5 h-5" />,
        title: "Lucro de Mercado Disponível"
      };
    } else {
      return {
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: <Info className="w-5 h-5" />,
        title: "Lucro de Mercado Disponível"
      };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={`${statusConfig.bgColor} border-${statusConfig.borderColor} p-4`}>
      <div className="flex items-start gap-3">
        <div className={statusConfig.color}>
          {statusConfig.icon}
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h3 className={`text-sm font-semibold ${statusConfig.color} mb-1`}>
              {statusConfig.title}
            </h3>
            <p className="text-xs text-slate-400">
              Lucro de mercado disponível como comparação experimental. 
              O lucro principal do sistema permanece inalterado.
            </p>
          </div>

          {/* Estatísticas */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Total:</span>
              <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
                {total} itens
              </Badge>
            </div>

            {alta > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{alta} Alta</span>
                </Badge>
              </div>
            )}

            {media > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>{media} Média</span>
                </Badge>
              </div>
            )}

            {baixa > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{baixa} Baixa</span>
                </Badge>
              </div>
            )}
          </div>

          {/* Recomendação */}
          {validacao.recomendacao && (
            <div className="pt-2 border-t border-slate-700/30">
              <p className="text-xs text-slate-400">
                <strong className={statusConfig.color}>Recomendação:</strong> {validacao.recomendacao}
              </p>
            </div>
          )}

          {/* Alertas */}
          {validacao.alertas && validacao.alertas.length > 0 && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="text-xs text-slate-500 mb-1.5">Alertas principais:</div>
              <ul className="space-y-1">
                {validacao.alertas.slice(0, 3).map((alerta, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className={statusConfig.color}>•</span>
                    <span>{alerta}</span>
                  </li>
                ))}
              </ul>
              {(validacao.total_alertas || 0) > 3 && (
                <p className="text-xs text-slate-500 mt-1.5">
                  +{(validacao.total_alertas || 0) - 3} alertas adicionais
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
