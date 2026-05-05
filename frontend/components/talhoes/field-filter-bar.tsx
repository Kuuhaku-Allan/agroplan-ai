"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FieldFilterBarProps {
  searchTerm: string;
  soloFilter: string;
  climaFilter: string;
  aguaFilter: string;
  onSearchChange: (value: string) => void;
  onSoloChange: (value: string) => void;
  onClimaChange: (value: string) => void;
  onAguaChange: (value: string) => void;
  onClearFilters: () => void;
}

export function FieldFilterBar({
  searchTerm,
  soloFilter,
  climaFilter,
  aguaFilter,
  onSearchChange,
  onSoloChange,
  onClimaChange,
  onAguaChange,
  onClearFilters
}: FieldFilterBarProps) {
  const hasActiveFilters = searchTerm || soloFilter !== "todos" || climaFilter !== "todos" || aguaFilter !== "todos";

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por talhão..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200"
          />
        </div>

        {/* Filtro Solo */}
        <Select value={soloFilter} onValueChange={onSoloChange}>
          <SelectTrigger className="w-full lg:w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
            <SelectValue placeholder="Solo" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800">
            <SelectItem value="todos">Todos os solos</SelectItem>
            <SelectItem value="argiloso">Argiloso</SelectItem>
            <SelectItem value="arenoso">Arenoso</SelectItem>
            <SelectItem value="misto">Misto</SelectItem>
            <SelectItem value="siltoso">Siltoso</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro Clima */}
        <Select value={climaFilter} onValueChange={onClimaChange}>
          <SelectTrigger className="w-full lg:w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
            <SelectValue placeholder="Clima" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800">
            <SelectItem value="todos">Todos os climas</SelectItem>
            <SelectItem value="quente">Quente</SelectItem>
            <SelectItem value="ameno">Ameno</SelectItem>
            <SelectItem value="frio">Frio</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro Água */}
        <Select value={aguaFilter} onValueChange={onAguaChange}>
          <SelectTrigger className="w-full lg:w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
            <SelectValue placeholder="Água" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800">
            <SelectItem value="todos">Todos os níveis</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>

        {/* Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="border-slate-700 hover:bg-slate-800/50"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
    </Card>
  );
}
