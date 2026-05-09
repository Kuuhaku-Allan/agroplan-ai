"use client";

import { CalendarDays, MapPin, Sprout, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZarcSummary } from "@/lib/types/zarc";

interface ZarcImpactBannerProps {
  zarc: ZarcSummary;
  onChangeRegion?: () => void;
}

export function ZarcImpactBanner({ zarc, onChangeRegion }: ZarcImpactBannerProps) {
  if (!zarc.ativo) {
    return null;
  }

  const getSourceBadge = () => {
    if (zarc.fallback) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Fallback
        </Badge>
      );
    }

    switch (zarc.source) {
      case "zarc-oficial":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Oficial
          </Badge>
        );
      case "zarc-cache":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Cache
          </Badge>
        );
      case "mixed":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
            Misto
          </Badge>
        );
      default:
        return null;
    }
  };

  const cobertura = zarc.culturas_com_zarc || 0;
  const total = zarc.total_culturas || 0;
  const percentual = total > 0 ? Math.round((cobertura / total) * 100) : 0;

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">ZARC Ativo</CardTitle>
              <CardDescription className="text-xs">
                Zoneamento Agrícola de Risco Climático
              </CardDescription>
            </div>
          </div>
          {getSourceBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Região */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">
            {zarc.municipio || "Não especificado"}/{zarc.uf}
          </span>
        </div>

        {/* Safra */}
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span>Safra {zarc.safra}</span>
        </div>

        {/* Cobertura */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Cobertura ZARC</span>
            <span className="font-semibold">{percentual}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {cobertura}/{total}
            </span>
          </div>
        </div>

        {/* Botão de alterar região */}
        {onChangeRegion && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onChangeRegion}
          >
            Alterar Região
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
