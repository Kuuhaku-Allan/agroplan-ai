import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Erro ao carregar dados",
  message = "Não foi possível conectar à API ativa. Se estiver usando API Render, ela pode estar acordando ou demorando para responder. Tente novamente ou selecione API Local nas configurações.",
  onRetry
}: ErrorStateProps) {
  return (
    <Card className="bg-slate-900/50 border-red-500/30 p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-50 mb-2">{title}</h3>
          <p className="text-sm text-slate-400 max-w-md">{message}</p>
        </div>

        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </Card>
  );
}
