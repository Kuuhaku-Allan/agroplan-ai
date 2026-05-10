"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Sprout,
  Target,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Navigation,
  Layers,
  Mountain,
  Droplets,
  AlertCircle,
} from "lucide-react";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { formatDateBRWithYear } from "@/lib/date-utils";
import type { ClimateLocation } from "@/lib/types/climate";
import type { ManualField, ManualFieldCreate, CropCalendarResponse } from "@/lib/types";
import { createPlanningField, generateFieldCalendar } from "@/lib/api";

interface GuidedPlanningWizardProps {
  existingFields: ManualField[];
  cultures: string[];
  currentRegion: ClimateLocation | null;
  onRegionChange: (location: ClimateLocation | null) => void;
  onComplete: (calendar: CropCalendarResponse) => void;
  onCancel: () => void;
}

type WizardStep = "region" | "field" | "profile" | "recommendation" | "calendar" | "summary";

interface WizardState {
  region: ClimateLocation | null;
  field: ManualField | null;
  newFieldData: ManualFieldCreate | null;
  objective: string;
  experienceLevel: string;
  selectedCulture: string;
  plantingDate: string;
  calendar: CropCalendarResponse | null;
}

export function GuidedPlanningWizard({
  existingFields,
  cultures,
  currentRegion,
  onRegionChange,
  onComplete,
  onCancel,
}: GuidedPlanningWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("region");
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wizardState, setWizardState] = useState<WizardState>({
    region: currentRegion,
    field: null,
    newFieldData: null,
    objective: "equilibrado",
    experienceLevel: "iniciante",
    selectedCulture: "soja",
    plantingDate: "",
    calendar: null,
  });

  const steps: { id: WizardStep; label: string; number: number }[] = [
    { id: "region", label: "Região", number: 1 },
    { id: "field", label: "Talhão", number: 2 },
    { id: "profile", label: "Objetivo", number: 3 },
    { id: "recommendation", label: "Recomendação", number: 4 },
    { id: "calendar", label: "Calendário", number: 5 },
    { id: "summary", label: "Resumo", number: 6 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  function handleRegionSelect(location: ClimateLocation | null) {
    setWizardState({ ...wizardState, region: location });
    onRegionChange(location);
  }

  function handleUseCurrentRegion() {
    if (!currentRegion) {
      setError("Nenhuma região selecionada. Use 'Selecionar Região' primeiro.");
      return;
    }
    setWizardState({ ...wizardState, region: currentRegion });
    setError(null);
  }

  async function handleCreateField() {
    if (!wizardState.newFieldData) return;

    try {
      setLoading(true);
      setError(null);

      const createdField = await createPlanningField(wizardState.newFieldData);
      setWizardState({ ...wizardState, field: createdField });
      setCurrentStep("profile");
    } catch (err: any) {
      setError(err.message || "Erro ao criar talhão");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCalendar() {
    if (!wizardState.field || !wizardState.selectedCulture || !wizardState.plantingDate) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Enable weather by default if field has lat/lon
      const usar_clima = !!(wizardState.field.lat && wizardState.field.lon);

      const calendar = await generateFieldCalendar(wizardState.field.id, {
        cultura: wizardState.selectedCulture,
        planting_date: wizardState.plantingDate,
        usar_clima,
      });

      setWizardState({ ...wizardState, calendar });
      setCurrentStep("summary");
    } catch (err: any) {
      setError(err.message || "Erro ao gerar calendário");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  }

  function handleBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  }

  function handleRestart() {
    setCurrentStep("region");
    setWizardState({
      region: currentRegion,
      field: null,
      newFieldData: null,
      objective: "equilibrado",
      experienceLevel: "iniciante",
      selectedCulture: "soja",
      plantingDate: "",
      calendar: null,
    });
    setError(null);
  }

  function handleFinish() {
    if (wizardState.calendar) {
      onComplete(wizardState.calendar);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      index <= currentStepIndex
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-slate-600 bg-slate-800/50 text-slate-500"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs ${
                      index <= currentStepIndex ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-12 transition-colors ${
                      index < currentStepIndex ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="rounded-2xl border border-red-500/20 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep === "region" && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Etapa 1: Selecione a Região
            </CardTitle>
            <CardDescription>
              Escolha a localização do seu talhão para obter recomendações precisas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wizardState.region ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-emerald-400">
                    📍 Região Selecionada
                  </p>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {wizardState.region.label}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>🌐 {wizardState.region.municipio}/{wizardState.region.uf}</p>
                  <p>📍 {wizardState.region.lat.toFixed(2)}, {wizardState.region.lon.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma região selecionada</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleUseCurrentRegion}
                disabled={!currentRegion}
                className="border-white/10 bg-slate-950/40 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Usar Região Atual
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRegionSelector(true)}
                className="border-white/10 bg-slate-950/40 hover:bg-cyan-500/10 hover:border-cyan-500/30"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Selecionar Região
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleNext}
                disabled={!wizardState.region}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add other steps here - will continue in next message */}

      {currentStep === "field" && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-500" />
              Etapa 2: Escolha ou Crie um Talhão
            </CardTitle>
            <CardDescription>
              Selecione um talhão existente ou cadastre um novo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingFields.length > 0 && (
              <div>
                <Label className="text-sm font-semibold text-slate-300 mb-3 block">
                  Talhões Existentes
                </Label>
                <div className="space-y-2">
                  {existingFields.map((field) => (
                    <button
                      key={field.id}
                      onClick={() => {
                        setWizardState({ ...wizardState, field });
                        setCurrentStep("profile");
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        wizardState.field?.id === field.id
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-white/10 bg-slate-950/40 hover:border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{field.name}</p>
                          <p className="text-sm text-slate-400">{field.area_ha.toFixed(1)} ha</p>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {field.soil_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mountain className="h-3 w-3" />
                            {field.slope}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Ou criar novo</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="new-field-name">Nome do Talhão</Label>
                <Input
                  id="new-field-name"
                  placeholder="Ex: Talhão Norte"
                  value={wizardState.newFieldData?.name || ""}
                  onChange={(e) =>
                    setWizardState({
                      ...wizardState,
                      newFieldData: {
                        name: e.target.value,
                        area_ha: wizardState.newFieldData?.area_ha || 0,
                        soil_type: wizardState.newFieldData?.soil_type || "argiloso",
                        slope: wizardState.newFieldData?.slope || "plano",
                        water_availability: wizardState.newFieldData?.water_availability || "media",
                        uf: wizardState.region?.uf || "",
                        municipio: wizardState.region?.municipio || "",
                        lat: wizardState.region?.lat,
                        lon: wizardState.region?.lon,
                      },
                    })
                  }
                  className="border-white/10 bg-slate-950/40 text-slate-100"
                />
              </div>

              <div>
                <Label htmlFor="new-field-area">Área (hectares)</Label>
                <Input
                  id="new-field-area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex: 10.5"
                  value={wizardState.newFieldData?.area_ha || ""}
                  onChange={(e) =>
                    setWizardState({
                      ...wizardState,
                      newFieldData: {
                        ...wizardState.newFieldData!,
                        area_ha: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="border-white/10 bg-slate-950/40 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="new-field-soil">Solo</Label>
                  <Select
                    value={wizardState.newFieldData?.soil_type || "argiloso"}
                    onValueChange={(value) =>
                      setWizardState({
                        ...wizardState,
                        newFieldData: {
                          ...wizardState.newFieldData!,
                          soil_type: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-slate-950/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900">
                      <SelectItem value="argiloso">Argiloso</SelectItem>
                      <SelectItem value="arenoso">Arenoso</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                      <SelectItem value="siltoso">Siltoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-field-slope">Relevo</Label>
                  <Select
                    value={wizardState.newFieldData?.slope || "plano"}
                    onValueChange={(value) =>
                      setWizardState({
                        ...wizardState,
                        newFieldData: {
                          ...wizardState.newFieldData!,
                          slope: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-slate-950/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900">
                      <SelectItem value="plano">Plano</SelectItem>
                      <SelectItem value="suave">Suave</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="ingreme">Íngreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-field-water">Água</Label>
                  <Select
                    value={wizardState.newFieldData?.water_availability || "media"}
                    onValueChange={(value) =>
                      setWizardState({
                        ...wizardState,
                        newFieldData: {
                          ...wizardState.newFieldData!,
                          water_availability: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-slate-950/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900">
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateField}
                disabled={
                  !wizardState.newFieldData?.name ||
                  !wizardState.newFieldData?.area_ha ||
                  loading
                }
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar e Continuar"
                )}
              </Button>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "profile" && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              Etapa 3: Defina seu Objetivo
            </CardTitle>
            <CardDescription>
              Conte-nos sobre suas prioridades e experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-slate-300 mb-3 block">
                Qual é seu objetivo principal?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "equilibrado", label: "Equilibrado", desc: "Balanceia lucro e risco" },
                  { value: "lucro", label: "Máximo Lucro", desc: "Prioriza retorno financeiro" },
                  { value: "risco", label: "Baixo Risco", desc: "Minimiza exposição ao risco" },
                  { value: "sustentavel", label: "Sustentável", desc: "Foca em diversidade" },
                ].map((obj) => (
                  <button
                    key={obj.value}
                    onClick={() => setWizardState({ ...wizardState, objective: obj.value })}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      wizardState.objective === obj.value
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-white/10 bg-slate-950/40 hover:border-emerald-500/30"
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">{obj.label}</p>
                    <p className="text-xs text-slate-400">{obj.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-300 mb-3 block">
                Qual seu nível de experiência?
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "iniciante", label: "Iniciante", desc: "Primeira safra" },
                  { value: "intermediario", label: "Intermediário", desc: "Algumas safras" },
                  { value: "avancado", label: "Avançado", desc: "Muito experiente" },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() =>
                      setWizardState({ ...wizardState, experienceLevel: level.value })
                    }
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      wizardState.experienceLevel === level.value
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 bg-slate-950/40 hover:border-cyan-500/30"
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">{level.label}</p>
                    <p className="text-xs text-slate-400">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "recommendation" && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-500" />
              Etapa 4: Culturas Recomendadas
            </CardTitle>
            <CardDescription>
              Baseado no seu perfil e região, recomendamos estas culturas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-400">
                💡 <strong>Dica:</strong> As recomendações consideram seu objetivo ({wizardState.objective}), 
                características do talhão e dados climáticos da região.
              </p>
            </div>

            <div className="space-y-3">
              {cultures.slice(0, 3).map((culture) => (
                <button
                  key={culture}
                  onClick={() => setWizardState({ ...wizardState, selectedCulture: culture })}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    wizardState.selectedCulture === culture
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/10 bg-slate-950/40 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white capitalize">{culture}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Adequada para {wizardState.field?.soil_type} • {wizardState.field?.water_availability} água
                      </p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                      Recomendada
                    </Badge>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "calendar" && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Etapa 5: Defina a Data de Plantio
            </CardTitle>
            <CardDescription>
              Escolha quando deseja plantar {wizardState.selectedCulture}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cultura Selecionada</p>
                  <p className="font-semibold text-white capitalize">{wizardState.selectedCulture}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Talhão</p>
                  <p className="font-semibold text-white">{wizardState.field?.name}</p>
                </div>
              </div>
            </div>

            {/* Weather Integration Info */}
            {wizardState.field?.lat && wizardState.field?.lon && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-400 mb-2">Clima Integrado Ativo</h4>
                    <p className="text-xs text-cyan-200/90 mb-2">
                      Para os próximos 16 dias usamos previsão meteorológica real. 
                      Depois disso usamos climatologia/histórico, não previsão exata.
                    </p>
                    <p className="text-xs text-cyan-200/70">
                      📍 {wizardState.field.municipio}/{wizardState.field.uf} • 
                      {wizardState.field.lat.toFixed(2)}, {wizardState.field.lon.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="planting-date">Data de Plantio Desejada</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                Algumas tarefas, como preparo do solo, podem ser planejadas antes da data de plantio.
              </p>
              <Input
                id="planting-date"
                type="date"
                value={wizardState.plantingDate}
                onChange={(e) =>
                  setWizardState({ ...wizardState, plantingDate: e.target.value })
                }
                className="border-white/10 bg-slate-950/40 text-slate-100 [color-scheme:dark]"
              />
            </div>

            <Button
              onClick={handleGenerateCalendar}
              disabled={!wizardState.plantingDate || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Calendário...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerar Calendário Agrícola
                </>
              )}
            </Button>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "summary" && wizardState.calendar && (
        <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Etapa 6: Resumo do Planejamento
            </CardTitle>
            <CardDescription>
              Seu calendário agrícola foi gerado com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400 mb-1">Talhão</p>
                <p className="font-semibold text-white">{wizardState.field?.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {wizardState.field?.area_ha.toFixed(1)} ha
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400 mb-1">Cultura</p>
                <p className="font-semibold text-white capitalize">
                  {wizardState.calendar.cultura}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {wizardState.calendar.cycle_days} dias de ciclo
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400 mb-1">Plantio</p>
                <p className="font-semibold text-white">
                  {formatDateBRWithYear(wizardState.calendar.planting_date)}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400 mb-1">Colheita Estimada</p>
                <p className="font-semibold text-white">
                  {formatDateBRWithYear(wizardState.calendar.estimated_harvest_date)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {wizardState.calendar.total_tasks}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Tarefas Totais</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-400">
                    {wizardState.calendar.weather_sensitive_tasks}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Sensíveis ao Clima</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {wizardState.calendar.critical_tasks}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Tarefas Críticas</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-400">
                💡 <strong>Próximos Passos:</strong> Acompanhe as tarefas do calendário, 
                monitore o clima e ajuste conforme necessário. Você pode voltar ao modo manual 
                para editar ou criar novos planejamentos.
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Novo Planejamento
              </Button>
              <Button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Region Selector Modal */}
      {showRegionSelector && (
        <ClimateRegionSelector
          onSelect={handleRegionSelect}
          onClose={() => setShowRegionSelector(false)}
          currentLocation={wizardState.region}
        />
      )}
    </div>
  );
}
