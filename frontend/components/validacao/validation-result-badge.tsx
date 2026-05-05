import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ValidationResultBadgeProps {
  otimoGlobal: boolean;
  size?: "sm" | "md" | "lg";
}

export function ValidationResultBadge({ otimoGlobal, size = "md" }: ValidationResultBadgeProps) {
  if (otimoGlobal) {
    return (
      <Badge 
        variant="outline" 
        className={`
          border-emerald-500/30 bg-emerald-500/10 text-emerald-500
          ${size === "sm" ? "text-xs px-2 py-0.5" : ""}
          ${size === "lg" ? "text-base px-4 py-2" : ""}
        `}
      >
        <CheckCircle2 className={`mr-1 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
        Ótimo Global Encontrado
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`
        border-amber-500/30 bg-amber-500/10 text-amber-500
        ${size === "sm" ? "text-xs px-2 py-0.5" : ""}
        ${size === "lg" ? "text-base px-4 py-2" : ""}
      `}
    >
      <AlertCircle className={`mr-1 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
      Solução Próxima do Ótimo
    </Badge>
  );
}
