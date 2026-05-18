'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Plus,
  Trash2,
  Sprout,
  MapPin,
  Droplets,
  Mountain,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Navigation,
  Wand2,
  Settings,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Lock,
} from 'lucide-react';
import {
  getPlanningFields,
  createPlanningField,
  deletePlanningField,
  generateFieldCalendar,
  getPlanningCultures,
  replanCalendar,
  applyReplanningSuggestion,
} from '@/lib/api';
import { formatDateBR, formatDateBRWithYear } from '@/lib/date-utils';
import type {
  ManualField,
  ManualFieldCreate,
  CropCalendarResponse,
  ReplanningEvent,
  ReplanningEventType,
  ReplanningResponse,
  ReplanningSuggestion,
} from '@/lib/types';
import { REPLANNING_EVENT_LABELS } from '@/lib/types';
import { ClimateRegionSelector } from '@/components/climate/climate-region-selector';
import { GuidedPlanningWizard } from '@/components/planning/guided-planning-wizard';
import type { ClimateLocation } from '@/lib/types/climate';
import { CLIMATE_STORAGE_KEY } from '@/lib/types/climate';
import { useAdvancedMode } from '@/hooks/useAdvancedMode';
import {
  ASSISTANT_LEVEL_LABELS,
  buildCalendarPayloadWithSettings,
} from '@/lib/settings';


type PlanningMode = 'manual' | 'guided';

type ReplanningChangeLogEntry = {
  action: string;
  old_date: string;
  new_date: string;
  [key: string]: unknown;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function PlanejamentoPage() {
  const {
    settings: advancedSettings,
    canUseClimate,
    canUseReplanning,
    canShowGuidedExplanations,
    canUseGuidedMode,
  } = useAdvancedMode();

  const climateEnabled = canUseClimate();
  const replanningEnabled = canUseReplanning();
  const guidedExplanationsEnabled = canShowGuidedExplanations();
  const guidedModeEnabled = canUseGuidedMode();
  const guidedModeSuggested =
    advancedSettings.assistant_level === 'iniciante' ||
    advancedSettings.assistant_level === 'intermediario';
  const manualModePreferred = advancedSettings.assistant_level === 'manual';

  const [mode, setMode] = useState<PlanningMode>('manual');
  const [fields, setFields] = useState<ManualField[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CropCalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<ClimateLocation | null>(null);

  // Replanning state (Fase 10.6)
  const [showReplanPanel, setShowReplanPanel] = useState(false);
  const [replanningEvent, setReplanningEvent] = useState<ReplanningEvent>({
    event_type: 'missed_irrigation',
    date: new Date().toISOString().split('T')[0],
    description: '',
    affected_task_id: undefined,
    severity: undefined,
    notes: undefined,
  });
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanResult, setReplanResult] = useState<ReplanningResponse | null>(null);
  const [replanError, setReplanError] = useState<string | null>(null);
  const [originalCalendar, setOriginalCalendar] = useState<CropCalendarResponse | null>(null);
  const [calendarView, setCalendarView] = useState<'original' | 'adjusted'>('original');
  const [adjustedCalendar, setAdjustedCalendar] = useState<CropCalendarResponse | null>(null);
  const [changeLog, setChangeLog] = useState<ReplanningChangeLogEntry[]>([]);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);



  // Form state
  const [formData, setFormData] = useState<ManualFieldCreate>({
    name: '',
    area_ha: 0,
    soil_type: 'argiloso',
    slope: 'plano',
    water_availability: 'media',
    uf: '',
    municipio: '',
    lat: undefined,
    lon: undefined,
  });

  // Calendar generation state
  const [calendarForm, setCalendarForm] = useState({
    cultura: 'soja',
    planting_date: '',
    usar_clima: false,
  });

  useEffect(() => {
    loadData();
    loadCurrentRegion();
  }, []);

  function loadCurrentRegion() {
    try {
      const stored = localStorage.getItem(CLIMATE_STORAGE_KEY);
      if (stored) {
        const location = JSON.parse(stored) as ClimateLocation;
        setCurrentRegion(location);
      }
    } catch (err) {
      console.error('Erro ao carregar região:', err);
    }
  }

  function handleUseCurrentRegion() {
    if (!currentRegion) {
      setError('Nenhuma região selecionada. Use "Selecionar Região" primeiro.');
      return;
    }

    setFormData({
      ...formData,
      uf: currentRegion.uf || '',
      municipio: currentRegion.municipio || '',
      lat: currentRegion.lat,
      lon: currentRegion.lon,
    });
    setSuccess(`Região ${currentRegion.label} aplicada ao formulário!`);
  }

  function handleRegionSelect(location: ClimateLocation | null) {
    if (location) {
      setCurrentRegion(location);
      localStorage.setItem(CLIMATE_STORAGE_KEY, JSON.stringify(location));
      
      setFormData({
        ...formData,
        uf: location.uf || '',
        municipio: location.municipio || '',
        lat: location.lat,
        lon: location.lon,
      });
      setSuccess(`Região ${location.label} selecionada e aplicada!`);
    } else {
      setCurrentRegion(null);
      localStorage.removeItem(CLIMATE_STORAGE_KEY);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [fieldsData, culturesData] = await Promise.all([
        getPlanningFields(),
        getPlanningCultures(),
      ]);

      setFields(fieldsData.talhoes || []);
      setCultures(culturesData.culturas || []);
    } catch (err) {
      setError('Erro ao carregar dados. Verifique se a API está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      await createPlanningField(formData);
      
      setSuccess('Talhão criado com sucesso!');
      setFormData({
        name: '',
        area_ha: 0,
        soil_type: 'argiloso',
        slope: 'plano',
        water_availability: 'media',
        uf: '',
        municipio: '',
        lat: undefined,
        lon: undefined,
      });
      
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar talhão'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteField(id: string) {
    if (!confirm('Tem certeza que deseja remover este talhão?')) return;

    try {
      setError(null);
      await deletePlanningField(id);
      setSuccess('Talhão removido com sucesso!');
      await loadData();
      
      if (selectedField === id) {
        setSelectedField(null);
        setCalendar(null);
        setOriginalCalendar(null);
        setAdjustedCalendar(null);
        setChangeLog([]);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao remover talhão'));
    }
  }

  async function handleGenerateCalendar(fieldId: string) {
    try {
      setGeneratingCalendar(true);
      setError(null);
      setSelectedField(fieldId);

      // Find the field to check for lat/lon
      const field = fields.find(f => f.id === fieldId);
      const wantsClimate = climateEnabled && calendarForm.usar_clima;
      
      // If usar_clima is true but no lat/lon, show warning
      if (wantsClimate && field && (!field.lat || !field.lon)) {
        setError('Para usar clima integrado, informe latitude e longitude do talhão.');
        setGeneratingCalendar(false);
        return;
      }

      const payload = buildCalendarPayloadWithSettings(
        {
          ...calendarForm,
          usar_clima: wantsClimate,
        },
        advancedSettings,
      );

      const result = await generateFieldCalendar(fieldId, payload);
      setCalendar(result);
      setOriginalCalendar(result);
      setAdjustedCalendar(null);
      setCalendarView('original');
      setChangeLog([]);
      setReplanResult(null); // limpar sugestões anteriores ao gerar novo calendário
      setSuccess('Calendário gerado com sucesso!');
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao gerar calendário'));
      setCalendar(null);
    } finally {
      setGeneratingCalendar(false);
    }
  }

  async function handleReplan() {
    if (!replanningEnabled) {
      setReplanError('Replanejamento por imprevistos está desativado nas Configurações.');
      return;
    }

    if (!calendar) return;
    if (!replanningEvent.description.trim()) {
      setReplanError('Descreva o imprevisto antes de continuar.');
      return;
    }

    try {
      setReplanLoading(true);
      setReplanError(null);
      setReplanResult(null);

      const result = await replanCalendar({
        calendar,
        event: replanningEvent,
      });

      setReplanResult(result);
    } catch (err) {
      setReplanError(getErrorMessage(err, 'Erro ao processar replanejamento.'));
    } finally {
      setReplanLoading(false);
    }
  }

  async function handleApplySuggestion(suggestion: ReplanningSuggestion) {
    if (!replanningEnabled) {
      setReplanError('Replanejamento por imprevistos está desativado nas Configurações.');
      return;
    }

    if (!calendar) return;

    if (suggestion.requires_manual_validation) {
      const confirm = window.confirm(
        'Esta sugestão exige validação manual. Deseja aplicar apenas como simulação?'
      );
      if (!confirm) return;
    }

    try {
      setApplyLoading(suggestion.id || 'loading');
      setReplanError(null);

      const result = await applyReplanningSuggestion({
        calendar,
        suggestion,
        event: replanningEvent,
      });

      setCalendar(result.updated_calendar);
      setAdjustedCalendar(result.updated_calendar);
      if (!originalCalendar) {
        setOriginalCalendar(result.original_calendar);
      }
      setCalendarView('adjusted');
      setChangeLog((prev) => [
        ...(result.change_log as ReplanningChangeLogEntry[]),
        ...prev,
      ]);
      setSuccess('Calendário ajustado em modo de simulação. O calendário original foi preservado.');
      
    } catch (err) {
      setReplanError(getErrorMessage(err, 'Erro ao aplicar sugestão.'));
    } finally {
      setApplyLoading(null);
    }
  }

  const totalArea = fields.reduce((sum, f) => sum + f.area_ha, 0);
  const statusBadgeClass = (enabled: boolean) =>
    enabled
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-slate-600/40 bg-slate-800/50 text-slate-400';


  if (loading) {
    return (
      <div>
        <Topbar
          title="Planejamento"
          subtitle="Cadastre seus talhões e gere calendários agrícolas por cultura"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="Planejamento"
        subtitle="Cadastre seus talhões e gere calendários agrícolas por cultura"
      />

      <div className="p-8 space-y-8">
        {/* Alerts */}
        {error && (
          <Card className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <p>{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modular Status */}
        <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
          <CardContent className="flex min-h-[88px] flex-col justify-center gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Modo atual: {ASSISTANT_LEVEL_LABELS[advancedSettings.assistant_level]}
                </span>
                <Badge variant="outline" className={statusBadgeClass(climateEnabled)}>
                  Clima: {climateEnabled ? 'ligado' : 'desligado'}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(replanningEnabled)}>
                  Replanejamento: {replanningEnabled ? 'ligado' : 'desligado'}
                </Badge>
                <Badge
                  variant="outline"
                  className={statusBadgeClass(guidedExplanationsEnabled)}
                >
                  Explicações: {guidedExplanationsEnabled ? 'completas' : 'reduzidas'}
                </Badge>
              </div>
              {guidedExplanationsEnabled && (
                <p className="text-xs text-slate-500">
                  As preferências abaixo são aplicadas antes de enviar dados para o backend.
                </p>
              )}
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/10 bg-slate-950/40 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Link href="/configuracoes">Editar configurações</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">
                Talhões Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{fields.length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">
                Área Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalArea.toFixed(1)} <span className="text-lg text-slate-400">ha</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">
                Culturas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{cultures.length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">
                Calendário Gerado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {calendar ? 'Sim' : 'Não'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              mode === 'manual'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : manualModePreferred
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/40'
                : 'border-white/10 bg-slate-950/40 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-white">Cadastro Manual</h3>
            </div>
            {guidedExplanationsEnabled && (
              <p className="text-sm text-slate-400 text-center">
                Para quem já sabe o que quer cadastrar
              </p>
            )}
          </button>

          <button
            onClick={() => setMode('guided')}
            disabled={!guidedModeEnabled}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              mode === 'guided'
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : guidedModeSuggested
                ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/40'
                : 'border-white/10 bg-slate-950/40 hover:border-cyan-500/30'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wand2 className="h-5 w-5 text-cyan-500" />
              <h3 className="font-semibold text-white">Planejamento Guiado</h3>
            </div>
            {guidedExplanationsEnabled && (
              <p className="text-sm text-slate-400 text-center">
                Passo a passo com recomendações personalizadas
              </p>
            )}
          </button>
        </div>

        {/* Guided Mode */}
        {mode === 'guided' && (
          <GuidedPlanningWizard
            existingFields={fields}
            cultures={cultures}
            currentRegion={currentRegion}
            assistantLevel={advancedSettings.assistant_level}
            canUseClimate={climateEnabled}
            showGuidedExplanations={guidedExplanationsEnabled}
            onRegionChange={handleRegionSelect}
            onComplete={(calendar) => {
              setCalendar(calendar);
              setSuccess('Calendário gerado com sucesso pelo modo guiado!');
              setMode('manual'); // Volta para manual para mostrar o calendário
            }}
            onCancel={() => setMode('manual')}
          />
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Create Field Form */}
          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                Criar Talhão
              </CardTitle>
              <CardDescription>
                Cadastre um novo talhão para planejamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateField} className="space-y-4">
                {/* Região do Talhão */}
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-slate-300">Região do Talhão</Label>
                    {currentRegion && (
                      <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                        {currentRegion.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentRegion}
                      disabled={!currentRegion}
                      className="border-white/10 bg-slate-950/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300"
                    >
                      <Navigation className="mr-2 h-3 w-3" />
                      Usar Região Atual
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegionSelector(true)}
                      className="border-white/10 bg-slate-950/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-300"
                    >
                      <MapPin className="mr-2 h-3 w-3" />
                      Selecionar Região
                    </Button>
                  </div>

                  {currentRegion && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>📍 {currentRegion.municipio}/{currentRegion.uf}</p>
                      <p>🌐 {currentRegion.lat.toFixed(2)}, {currentRegion.lon.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="name">Nome do Talhão</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Talhão Norte"
                    required
                    className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <Label htmlFor="area">Área (hectares)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.area_ha || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, area_ha: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="Ex: 10.5"
                    required
                    className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="soil">Solo</Label>
                    <Select
                      value={formData.soil_type}
                      onValueChange={(value) => setFormData({ ...formData, soil_type: value })}
                    >
                      <SelectTrigger id="soil" className="border-white/10 bg-slate-950/40 text-slate-100 focus:border-emerald-400/50 focus:ring-emerald-400/20">
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
                    <Label htmlFor="slope">Relevo</Label>
                    <Select
                      value={formData.slope}
                      onValueChange={(value) => setFormData({ ...formData, slope: value })}
                    >
                      <SelectTrigger id="slope" className="border-white/10 bg-slate-950/40 text-slate-100 focus:border-emerald-400/50 focus:ring-emerald-400/20">
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
                    <Label htmlFor="water">Água</Label>
                    <Select
                      value={formData.water_availability}
                      onValueChange={(value) =>
                        setFormData({ ...formData, water_availability: value })
                      }
                    >
                      <SelectTrigger id="water" className="border-white/10 bg-slate-950/40 text-slate-100 focus:border-emerald-400/50 focus:ring-emerald-400/20">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={formData.uf}
                      onChange={(e) =>
                        setFormData({ ...formData, uf: e.target.value.toUpperCase() })
                      }
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="municipio">Município</Label>
                    <Input
                      id="municipio"
                      value={formData.municipio}
                      onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                      placeholder="Ex: Clementina"
                      className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={formData.lat || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lat: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="Ex: -21.56"
                      className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lon">Longitude</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.000001"
                      value={formData.lon || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lon: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="Ex: -50.45"
                      className="border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-emerald-400/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Talhão
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fields List */}
          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-500" />
                Meus Talhões
              </CardTitle>
              <CardDescription>
                {fields.length === 0
                  ? 'Nenhum talhão cadastrado ainda'
                  : `${fields.length} talhão(ões) cadastrado(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Sprout className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Cadastre seu primeiro talhão para começar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {fields.map((field) => (
                    <Card
                      key={field.id}
                      className="rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-200"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{field.name}</h3>
                            <p className="text-sm text-slate-400">
                              {field.area_ha.toFixed(1)} ha
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 -mt-1 -mr-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Layers className="h-3 w-3" />
                            {field.soil_type}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Mountain className="h-3 w-3" />
                            {field.slope}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Droplets className="h-3 w-3" />
                            {field.water_availability}
                          </div>
                        </div>

                        {field.municipio && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                            <MapPin className="h-3 w-3" />
                            {field.municipio}/{field.uf}
                          </div>
                        )}

                        <Separator className="my-3 bg-white/5" />

                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={calendarForm.cultura}
                              onValueChange={(value) =>
                                setCalendarForm({ ...calendarForm, cultura: value })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs border-white/10 bg-slate-900/50 text-slate-100 focus:border-cyan-400/50 focus:ring-cyan-400/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-white/10 bg-slate-900">
                                {cultures.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              type="date"
                              value={calendarForm.planting_date}
                              onChange={(e) =>
                                setCalendarForm({ ...calendarForm, planting_date: e.target.value })
                              }
                              className="h-8 text-xs border-white/10 bg-slate-900/50 text-slate-100 focus:border-cyan-400/50 focus:ring-cyan-400/20 [color-scheme:dark]"
                            />
                          </div>

                          {/* Weather Toggle */}
                          {field.lat && field.lon && climateEnabled && (
                            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={calendarForm.usar_clima && climateEnabled}
                                onChange={(e) =>
                                  setCalendarForm({ ...calendarForm, usar_clima: e.target.checked })
                                }
                                className="rounded border-white/10 bg-slate-900/50 text-cyan-600 focus:ring-cyan-400/20"
                              />
                              <span>Usar clima integrado</span>
                            </label>
                          )}

                          {field.lat && field.lon && !climateEnabled && (
                            <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-400">
                              Clima integrado está desativado nas Configurações.
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="w-full bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                            onClick={() => handleGenerateCalendar(field.id)}
                            disabled={!calendarForm.planting_date || generatingCalendar}
                          >
                            {generatingCalendar && selectedField === field.id ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <CalendarDays className="mr-2 h-3 w-3" />
                                Gerar Calendário
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Display */}
        {calendar && (
          <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-500" />
                  Calendário Agrícola - {calendar.cultura.charAt(0).toUpperCase() + calendar.cultura.slice(1)}
                  {calendarView === 'adjusted' && (
                    <Badge variant="outline" className="text-xs border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-500/10 ml-2">
                      Ajustado
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Plantio: {formatDateBRWithYear(calendar.planting_date)} • Colheita
                  estimada: {formatDateBRWithYear(calendar.estimated_harvest_date)} •{' '}
                  {calendar.cycle_days} dias • {calendar.total_tasks} tarefas
                </CardDescription>
              </div>
              
              {originalCalendar && changeLog.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={calendarView === 'original' ? 'default' : 'outline'}
                    onClick={() => {
                      setCalendarView('original');
                      if (originalCalendar) setCalendar(originalCalendar);
                    }}
                    className={calendarView === 'original' ? 'bg-slate-700 hover:bg-slate-600' : 'border-slate-700 text-slate-300'}
                  >
                    Ver Original
                  </Button>
                  <Button
                    size="sm"
                    variant={calendarView === 'adjusted' ? 'default' : 'outline'}
                    onClick={() => {
                      setCalendarView('adjusted');
                      if (adjustedCalendar) setCalendar(adjustedCalendar);
                    }}
                    className={calendarView === 'adjusted' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'border-fuchsia-500/30 text-fuchsia-400'}
                  >
                    Ver Ajustado
                  </Button>
                  {calendarView === 'adjusted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if(confirm('Deseja reverter todas as sugestões e voltar ao calendário original?')) {
                          setCalendar(originalCalendar);
                          setAdjustedCalendar(null);
                          setCalendarView('original');
                          setChangeLog([]);
                        }
                      }}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-2"
                    >
                      Reverter
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Weather Summary */}
              {climateEnabled && calendar.weather_enabled && calendar.weather_summary && (
                <div className="mb-4 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-cyan-400 mb-2">Clima Integrado Ativo</h4>
                      <div className="grid grid-cols-3 gap-3 text-xs text-cyan-200/90">
                        <div>
                          <span className="font-medium">Previsão Real:</span>{' '}
                          {calendar.weather_summary.forecast_tasks} tarefa(s)
                        </div>
                        <div>
                          <span className="font-medium">Climatologia:</span>{' '}
                          {calendar.weather_summary.climatology_tasks} tarefa(s)
                        </div>
                        <div>
                          <span className="font-medium">Fontes:</span>{' '}
                          {calendar.weather_summary.sources.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather Warnings */}
              {climateEnabled && calendar.weather_warnings && calendar.weather_warnings.length > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-400 mb-2">Informações Climáticas</h4>
                      <ul className="space-y-1 text-xs text-blue-200/90">
                        {calendar.weather_warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {calendar.calendar_warnings && calendar.calendar_warnings.length > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-500 mb-2">Atenção</h4>
                      <ul className="space-y-1 text-sm text-amber-200/90">
                        {calendar.calendar_warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Cautela */}
              {guidedExplanationsEnabled && calendar.cautela && (
                <div className="mb-4 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
                  <p className="text-xs text-cyan-200/80 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span>{calendar.cautela}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {calendar.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 p-3 rounded-lg border border-white/10 bg-slate-950/40 backdrop-blur-sm hover:border-emerald-500/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-sm text-slate-400 min-w-[80px]">
                        {formatDateBR(task.date)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium text-white">{task.title}</h4>
                          {task.priority && (
                            <Badge
                              variant={
                                task.priority === 'critical'
                                  ? 'destructive'
                                  : task.priority === 'high'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={`text-xs ${
                                task.priority === 'critical'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : task.priority === 'high'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              }`}
                            >
                              {task.priority === 'critical'
                                ? 'Crítica'
                                : task.priority === 'high'
                                ? 'Alta'
                                : task.priority === 'medium'
                                ? 'Média'
                                : 'Baixa'}
                            </Badge>
                          )}
                          {climateEnabled && task.weather_sensitive && (
                            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30 bg-cyan-500/10">
                              Sensível ao clima
                            </Badge>
                          )}
                          {task.adjusted && (
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 bg-amber-500/10">
                              Ajustada
                            </Badge>
                          )}
                          {task.replanned && (
                            <Badge variant="outline" className="text-xs text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-500/10">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Replanejada
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-400">{task.description}</p>
                        )}
                        {task.replanned && task.replanning_reason && (
                          <div className="mt-2 p-2 rounded-md border border-fuchsia-500/20 bg-fuchsia-500/5">
                            <p className="text-xs text-fuchsia-300">
                              <strong className="text-fuchsia-400">Data Original: </strong>
                              {formatDateBR(task.original_date || '')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              <strong className="text-slate-300">Motivo: </strong>
                              {task.replanning_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Weather Context */}
                    {climateEnabled && task.weather_context && task.weather_context.active && (
                      <div
                        className={`p-3 rounded-lg border ${
                          task.weather_context.forecast_type === 'forecast'
                            ? 'border-cyan-500/30 bg-cyan-500/10'
                            : 'border-amber-500/30 bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-xs font-semibold ${
                                  task.weather_context.forecast_type === 'forecast'
                                    ? 'text-cyan-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {task.weather_context.forecast_type === 'forecast'
                                  ? '🌤️ Previsão Real'
                                  : task.weather_context.source === 'nasa-power'
                                  ? '🛰️ NASA POWER'
                                  : '📊 Climatologia'}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  task.weather_context.confidence === 'alta'
                                    ? 'border-emerald-500/30 text-emerald-400'
                                    : task.weather_context.confidence === 'media'
                                    ? 'border-amber-500/30 text-amber-400'
                                    : 'border-slate-500/30 text-slate-400'
                                }`}
                              >
                                {task.weather_context.confidence === 'alta'
                                  ? 'Alta confiança'
                                  : task.weather_context.confidence === 'media'
                                  ? 'Média confiança'
                                  : 'Baixa confiança'}
                              </Badge>
                            </div>
                            <p
                              className={`text-xs mb-2 ${
                                task.weather_context.forecast_type === 'forecast'
                                  ? 'text-cyan-200/90'
                                  : 'text-amber-200/90'
                              }`}
                            >
                              {task.weather_context.summary}
                            </p>
                            {task.weather_context.recommendation && (
                              <p
                                className={`text-xs font-medium ${
                                  task.weather_context.forecast_type === 'forecast'
                                    ? 'text-cyan-300'
                                    : 'text-amber-300'
                                }`}
                              >
                                💡 {task.weather_context.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== Seção Registrar Imprevisto (Fase 10.6) ===== */}
        {calendar && replanningEnabled && (
          <Card className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/80 via-amber-950/10 to-slate-950/70 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setShowReplanPanel(!showReplanPanel)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Registrar Imprevisto
                      <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 bg-amber-500/10">
                        Sugestão de ajuste
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-0.5">
                      Informe o que aconteceu e receba sugestões de ajuste no calendário
                    </CardDescription>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors p-1">
                  {showReplanPanel ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </CardHeader>

            {showReplanPanel && (
              <CardContent className="space-y-5">
                {/* Disclaimer */}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-600/30 bg-slate-800/40">
                  <ShieldAlert className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Sugestão de ajuste:</strong> Avalie as condições reais do talhão antes de executar qualquer ação. 
                    Nenhuma sugestão é aplicada automaticamente. 
                    Consulte assistência técnica em caso de pragas ou doenças.
                  </p>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo do Imprevisto */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-300">Tipo do Imprevisto</Label>
                    <Select
                      value={replanningEvent.event_type}
                      onValueChange={(v) =>
                        setReplanningEvent({ ...replanningEvent, event_type: v as ReplanningEventType })
                      }
                    >
                      <SelectTrigger className="border-white/10 bg-slate-950/60 text-slate-100 focus:border-amber-400/50 focus:ring-amber-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-900">
                        {(Object.keys(REPLANNING_EVENT_LABELS) as ReplanningEventType[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {REPLANNING_EVENT_LABELS[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-slate-300">Data do Imprevisto</Label>
                    <Input
                      type="date"
                      value={replanningEvent.date}
                      onChange={(e) =>
                        setReplanningEvent({ ...replanningEvent, date: e.target.value })
                      }
                      className="border-white/10 bg-slate-950/60 text-slate-100 focus:border-amber-400/50 focus:ring-amber-400/20 [color-scheme:dark]"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-sm text-slate-300">Descrição do Imprevisto</Label>
                    <Input
                      placeholder="Ex: Não consegui irrigar nesse dia por falta de combustível"
                      value={replanningEvent.description}
                      onChange={(e) =>
                        setReplanningEvent({ ...replanningEvent, description: e.target.value })
                      }
                      className="border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-amber-400/20"
                    />
                  </div>

                  {/* Tarefa afetada (opcional) */}
                  {calendar.tasks.length > 0 && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-sm text-slate-300">
                        Tarefa Afetada <span className="text-slate-500 font-normal">(opcional)</span>
                      </Label>
                      <Select
                        value={replanningEvent.affected_task_id || '__none__'}
                        onValueChange={(v) =>
                          setReplanningEvent({
                            ...replanningEvent,
                            affected_task_id: v === '__none__' ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger className="border-white/10 bg-slate-950/60 text-slate-100 focus:border-amber-400/50 focus:ring-amber-400/20">
                          <SelectValue placeholder="Selecionar tarefa afetada (opcional)" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-slate-900 max-h-52">
                          <SelectItem value="__none__">Nenhuma tarefa específica</SelectItem>
                          {calendar.tasks.slice(0, 50).map((task, i) => (
                            <SelectItem key={task.id || i} value={task.id || String(i)}>
                              {task.date} — {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Error */}
                {replanError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {replanError}
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={handleReplan}
                  disabled={replanLoading || !replanningEvent.description.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 font-semibold"
                >
                  {replanLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando sugestões...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Gerar Sugestões
                    </>
                  )}
                </Button>

                {/* Results */}
                {replanResult && (
                  <div className="space-y-4 pt-2">
                    {/* Summary */}
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <ClipboardList className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-300 mb-0.5">Resultado</p>
                          <p className="text-xs text-amber-200/80">{replanResult.summary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {replanResult.warnings.length > 0 && (
                      <div className="p-3 rounded-lg border border-slate-600/30 bg-slate-800/40">
                        <ul className="space-y-1">
                          {replanResult.warnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <ShieldAlert className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestion Cards */}
                    <div className="space-y-3">
                      {replanResult.suggestions.map((sug, i) => {
                        const riskColors: Record<string, string> = {
                          baixo: 'border-emerald-500/30 bg-emerald-500/8',
                          medio: 'border-amber-500/30 bg-amber-500/8',
                          alto: 'border-red-500/30 bg-red-500/8',
                        };
                        const riskBadge: Record<string, string> = {
                          baixo: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
                          medio: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
                          alto: 'border-red-500/40 text-red-400 bg-red-500/10',
                        };
                        const riskLabel: Record<string, string> = {
                          baixo: '🟢 Risco Baixo',
                          medio: '🟡 Risco Médio',
                          alto: '🔴 Risco Alto',
                        };

                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-4 backdrop-blur-sm space-y-3 transition-all ${riskColors[sug.risk_level] || 'border-white/10 bg-slate-900/40'}`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white flex-1">{sug.action}</p>
                              <div className="flex gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${riskBadge[sug.risk_level] || 'border-white/20 text-slate-400'}`}
                                >
                                  {riskLabel[sug.risk_level] || sug.risk_level}
                                </Badge>
                                {sug.requires_manual_validation && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-violet-500/40 text-violet-300 bg-violet-500/10"
                                  >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Validação manual
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Dates */}
                            {(sug.original_date || sug.suggested_date) && (
                              <div className="flex gap-4 text-xs text-slate-400">
                                {sug.original_date && (
                                  <span>📅 Original: <strong className="text-slate-300">{sug.original_date}</strong></span>
                                )}
                                {sug.suggested_date && (
                                  <span>📅 Sugerida: <strong className="text-emerald-300">{sug.suggested_date}</strong></span>
                                )}
                              </div>
                            )}

                            {/* Reason */}
                            <p className="text-xs text-slate-400 leading-relaxed">{sug.reason}</p>

                            {/* Apply Button */}
                            <Button
                              onClick={() => handleApplySuggestion(sug)}
                              disabled={applyLoading === (sug.id || 'loading')}
                              size="sm"
                              className="w-full text-xs bg-slate-700 hover:bg-emerald-600 border-0 transition-colors"
                            >
                              {applyLoading === (sug.id || 'loading') ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : sug.requires_manual_validation ? (
                                <Lock className="mr-2 h-3 w-3 text-amber-300" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-3 w-3" />
                              )}
                              Aplicar sugestão
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {calendar && !replanningEnabled && (
          <Card className="rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Replanejamento por imprevistos está desativado nas Configurações.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  O calendário continua disponível, mas a tela não permite registrar imprevistos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Replanejamento */}
        {replanningEnabled && changeLog.length > 0 && (
          <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-500" />
                Histórico de Replanejamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {changeLog.map((log, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-slate-950/40">
                    <div>
                      <p className="text-sm font-medium text-white">{log.action}</p>
                      <div className="flex gap-4 text-xs text-slate-400 mt-1">
                        <span>Original: {formatDateBR(log.old_date)}</span>
                        <span>Sugerida: <strong className="text-emerald-400">{formatDateBR(log.new_date)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </>
        )}

        {/* Region Selector Modal */}
        {showRegionSelector && (
          <ClimateRegionSelector
            onSelect={handleRegionSelect}
            onClose={() => setShowRegionSelector(false)}
            currentLocation={currentRegion}
          />
        )}
      </div>
    </div>
  );
}
