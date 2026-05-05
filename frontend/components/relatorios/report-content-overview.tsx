import { Card } from "@/components/ui/card";
import { 
  FileText, 
  MapPin, 
  Layers, 
  Dna, 
  FlaskConical, 
  TrendingUp, 
  Sprout, 
  AlertTriangle, 
  Rocket 
} from "lucide-react";

export function ReportContentOverview() {
  const sections = [
    {
      icon: FileText,
      title: "Resumo Executivo",
      description: "Plano recomendado, métricas gerais e justificativa"
    },
    {
      icon: MapPin,
      title: "Características dos Talhões",
      description: "Detalhes de solo, clima, relevo e água de cada talhão"
    },
    {
      icon: Layers,
      title: "Comparação de Cenários",
      description: "Análise comparativa entre AG e cenários manuais"
    },
    {
      icon: Dna,
      title: "Resultado do Algoritmo Genético",
      description: "Configuração, resultado e plano detalhado do AG"
    },
    {
      icon: FlaskConical,
      title: "Validação",
      description: "Validação por força bruta ou múltiplas rodadas"
    },
    {
      icon: TrendingUp,
      title: "Estabilidade do Algoritmo",
      description: "Análise estatística de múltiplas execuções"
    },
    {
      icon: Sprout,
      title: "Justificativa Agronômica",
      description: "Explicação técnica das escolhas por talhão"
    },
    {
      icon: AlertTriangle,
      title: "Limitações do Sistema",
      description: "Restrições e considerações importantes"
    },
    {
      icon: Rocket,
      title: "Próximas Evoluções",
      description: "Roadmap de melhorias futuras"
    }
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">
        O que o relatório contém?
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                <Icon className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">
                  {section.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {section.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
