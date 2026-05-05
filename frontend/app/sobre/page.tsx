import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";

export default function SobrePage() {
  return (
    <div>
      <Topbar
        title="Sobre"
        subtitle="Conheça o AgroPlan AI"
      />
      <div className="p-8">
        <Card className="bg-slate-900/50 border-slate-800/50 p-6 max-w-3xl">
          <h3 className="text-xl font-bold text-slate-50 mb-4">AgroPlan AI</h3>
          <p className="text-slate-300 leading-relaxed mb-4">
            Sistema Inteligente de Planejamento de Plantio usando Algoritmo Genético 
            para otimização multi-objetivo.
          </p>
          <p className="text-slate-400 text-sm">
            Versão 5.0 - Fase 5.1 (Interface Premium)
          </p>
        </Card>
      </div>
    </div>
  );
}
