"use client";

import { Calendar, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ZarcData } from "@/lib/types/zarc";

interface ZarcWindowCardProps {
  zarc: ZarcData;
  cultura?: string;
  compact?: boolean;
}

export function ZarcWindowCard({ zarc, cultura, compact = false }: ZarcWindowCardProps) {
  if (!zarc.ativo) {
    return (
      <Alert variant="default" className="border-amber-500/20 bg-amber-500/5">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          {zarc.message || "Sem recomendação ZARC encontrada para esta cultura/região."}
        </AlertDescription>
      </Alert>
    );
  }

  const getRiscoBadge = () => {
    const risco = zarc.risco?.toLowerCase();
    
    switch (risco) {
      case "baixo":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Risco Baixo
          </Badge>
        );
      case "medio":
      case "médio":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Risco Médio
          </Badge>
        );
      case "alto":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Risco Alto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {zarc.risco || "Indeterminado"}
          </Badge>
        );
    }
  };

  const getSourceLabel = () => {
    if (zarc.fallback) return "Dados Simplificados";
    
    switch (zarc.source) {
      case "zarc-oficial":
        return "ZARC Oficial";
      case "zarc-cache":
        return "ZARC Cache";
      default:
        return zarc.source || "ZARC";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {zarc.janela_plantio?.inicio} a {zarc.janela_plantio?.fim}
            </p>
            <p className="text-xs text-muted-foreground">
              Janela de Plantio • Safra {zarc.safra}
            </p>
          </div>
        </div>
        {getRiscoBadge()}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Janela de Plantio ZARC
            </CardTitle>
            {cultura && (
              <CardDescription className="mt-1">
                {cultura}
              </CardDescription>
            )}
          </div>
          {getRiscoBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Janela de Plantio */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Período Recomendado</p>
              <p className="text-lg font-semibold">
                {zarc.janela_plantio?.inicio} a {zarc.janela_plantio?.fim}
              </p>
            </div>
          </div>
        </div>

        {/* Safra */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Safra</span>
          <span className="font-medium">{zarc.safra}</span>
        </div>

        {/* Fonte */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fonte</span>
          <span className="font-medium">{getSourceLabel()}</span>
        </div>

        {/* Município ZARC (se diferente) */}
        {zarc.municipio_zarc && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Município</span>
            <span className="font-medium">{zarc.municipio_zarc}</span>
          </div>
        )}

        {/* Observação */}
        {zarc.observacao && (
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {zarc.observacao}
            </AlertDescription>
          </Alert>
        )}

        {/* Decêndios (opcional, para debug) */}
        {zarc.decendios_recomendados && zarc.decendios_recomendados.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Decêndios recomendados ({zarc.decendios_recomendados.length})
            </summary>
            <p className="mt-1 pl-4">
              {zarc.decendios_recomendados.join(", ")}
            </p>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
