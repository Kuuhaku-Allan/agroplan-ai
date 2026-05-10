'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  getPlanningFields,
  createPlanningField,
  deletePlanningField,
  generateFieldCalendar,
  getPlanningCultures,
} from '@/lib/api';
import type {
  ManualField,
  ManualFieldCreate,
  CropCalendarResponse,
  CropInfo,
} from '@/lib/types';
import { ClimateRegionSelector } from '@/components/climate/climate-region-selector';
import { GuidedPlanningWizard } from '@/components/planning/guided-planning-wizard';
import type { ClimateLocation } from '@/lib/types/climate';
import { CLIMATE_STORAGE_KEY } from '@/lib/types/climate';

type PlanningMode = 'manual' | 'guided';

export default function PlanejamentoPage() {
  const [mode, setMode] = useState<PlanningMode>('manual');
  const [fields, setFields] = useState<ManualField[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
  const [culturesInfo, setCulturesInfo] = useState<Record<string, CropInfo>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CropCalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<ClimateLocation | null>(null);

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
      setCulturesInfo(culturesData.detalhes || {});
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
    } catch (err: any) {
      setError(err.message || 'Erro ao criar talhão');
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
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover talhão');
    }
  }

  async function handleGenerateCalendar(fieldId: string) {
    try {
      setGeneratingCalendar(true);
      setError(null);
      setSelectedField(fieldId);

      const result = await generateFieldCalendar(fieldId, calendarForm);
      setCalendar(result);
      setSuccess('Calendário gerado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar calendário');
      setCalendar(null);
    } finally {
      setGeneratingCalendar(false);
    }
  }

  const totalArea = fields.reduce((sum, f) => sum + f.area_ha, 0);

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
                : 'border-white/10 bg-slate-950/40 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-white">Cadastro Manual</h3>
            </div>
            <p className="text-sm text-slate-400 text-center">
              Para quem já sabe o que quer cadastrar
            </p>
          </button>

          <button
            onClick={() => setMode('guided')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              mode === 'guided'
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : 'border-white/10 bg-slate-950/40 hover:border-cyan-500/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wand2 className="h-5 w-5 text-cyan-500" />
              <h3 className="font-semibold text-white">Planejamento Guiado</h3>
            </div>
            <p className="text-sm text-slate-400 text-center">
              Passo a passo com recomendações personalizadas
            </p>
          </button>
        </div>

        {/* Guided Mode */}
        {mode === 'guided' && (
          <GuidedPlanningWizard
            existingFields={fields}
            cultures={cultures}
            currentRegion={currentRegion}
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-500" />
                Calendário Agrícola - {calendar.cultura.charAt(0).toUpperCase() + calendar.cultura.slice(1)}
              </CardTitle>
              <CardDescription>
                Plantio: {new Date(calendar.planting_date).toLocaleDateString('pt-BR')} • Colheita
                estimada: {new Date(calendar.estimated_harvest_date).toLocaleDateString('pt-BR')} •{' '}
                {calendar.cycle_days} dias • {calendar.total_tasks} tarefas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendar.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-slate-950/40 backdrop-blur-sm hover:border-emerald-500/20 transition-colors"
                  >
                    <div className="text-sm text-slate-400 min-w-[80px]">
                      {new Date(task.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
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
                        {task.weather_sensitive && (
                          <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30 bg-cyan-500/10">
                            Sensível ao clima
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-400">{task.description}</p>
                      )}
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
