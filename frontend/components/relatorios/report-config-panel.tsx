import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Gauge } from "lucide-react";

interface ReportConfigPanelProps {
  objetivo: string;
  formato: "md" | "txt";
  perfil: "rapido" | "completo";
  loading: boolean;
  onObjetivoChange: (objetivo: string) => void;
  onFormatoChange: (formato: "md" | "txt") => void;
  onPerfilChange: (perfil: "rapido" | "completo") => void;
  onGenerate: () => void;
}

export function ReportConfigPanel({
  objetivo,
  formato,
  perfil,
  loading,
  onObjetivoChange,
  onFormatoChange,
  onPerfilChange,
  onGenerate
}: ReportConfigPanelProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Configuração do Relatório</h3>
          <p className="text-sm text-slate-400 mt-1">
            Selecione o objetivo, formato e perfil de performance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Objetivo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Objetivo
          </label>
          <Select
            value={objetivo}
            onValueChange={onObjetivoChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full bg-slate-900/80 border-slate-700/70 text-slate-100 rounded-xl hover:border-emerald-500/50 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 shadow-2xl rounded-xl">
              <SelectItem 
                value="equilibrado"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Equilibrado
              </SelectItem>
              <SelectItem 
                value="lucro"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Máximo Lucro
              </SelectItem>
              <SelectItem 
                value="risco"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Baixo Risco
              </SelectItem>
              <SelectItem 
                value="sustentavel"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Sustentável
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Perfil de Performance */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Gauge className="w-4 h-4 inline mr-1" />
            Perfil de Performance
          </label>
          <Select
            value={perfil}
            onValueChange={(value) => onPerfilChange(value as "rapido" | "completo")}
            disabled={loading}
          >
            <SelectTrigger className="w-full bg-slate-900/80 border-slate-700/70 text-slate-100 rounded-xl hover:border-emerald-500/50 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 shadow-2xl rounded-xl">
              <SelectItem 
                value="rapido"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                <div className="flex items-center gap-2">
                  <span>Rápido</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                </div>
              </SelectItem>
              <SelectItem 
                value="completo"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Completo
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-2">
            {perfil === "completo" && "Executa validações completas e pode demorar mais."}
          </p>
        </div>

        {/* Formato */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Formato
          </label>
          <Select
            value={formato}
            onValueChange={(value) => onFormatoChange(value as "md" | "txt")}
            disabled={loading}
          >
            <SelectTrigger className="w-full bg-slate-900/80 border-slate-700/70 text-slate-100 rounded-xl hover:border-emerald-500/50 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 shadow-2xl rounded-xl">
              <SelectItem 
                value="md"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Markdown (.md)
              </SelectItem>
              <SelectItem 
                value="txt"
                className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-300 data-[state=checked]:text-emerald-400"
              >
                Texto (.txt)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
