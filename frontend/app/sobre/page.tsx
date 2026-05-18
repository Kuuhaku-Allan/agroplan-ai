"use client";

import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  Target,
  Database,
  Code2,
  Cloud,
  TrendingUp,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Calendar,
  Settings,
  Zap,
  Shield,
  Leaf,
  RefreshCw,
  Package,
  Globe,
  Server,
  Palette,
  Terminal,
  GitBranch,
} from "lucide-react";

export default function SobrePage() {
  return (
    <div>
      <Topbar
        title="Sobre o AgroPlan AI"
        subtitle="Sistema inteligente de apoio ao planejamento agrícola"
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Introdução */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
              <Sprout className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-50 mb-2">O que é o AgroPlan AI?</h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                O AgroPlan AI combina otimização, dados climáticos, zoneamento agrícola, preços de referência 
                e calendários de safra para apoiar decisões de plantio de forma explicável.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Apoio à decisão agrícola</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Dados reais integrados</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Modelos explicáveis</span>
            </div>
          </div>
        </Card>

        {/* Objetivo do Projeto */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Objetivo do Projeto</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                O AgroPlan AI foi desenvolvido para apoiar o planejamento agrícola através de ferramentas 
                inteligentes que organizam informações, simulam cenários e geram calendários de safra.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Apoiar planejamento agrícola com dados reais",
              "Organizar talhões e características do terreno",
              "Simular cenários com diferentes objetivos",
              "Gerar calendário agrícola por cultura",
              "Acompanhar imprevistos e sugerir ajustes",
              "Melhorar tomada de decisão com transparência",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* O que o sistema faz */}
        <div>
          <h2 className="text-2xl font-bold text-slate-50 mb-6">Funcionalidades Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: "Análise de Talhões", desc: "Visualização e filtros inteligentes", color: "emerald" },
              { icon: Lightbulb, title: "Recomendação de Culturas", desc: "Baseada em características do terreno", color: "blue" },
              { icon: Zap, title: "Algoritmo Genético", desc: "Otimização multi-objetivo explicável", color: "purple" },
              { icon: Calendar, title: "Calendário Agrícola", desc: "Tarefas por fase para 10 culturas", color: "amber" },
              { icon: Cloud, title: "Clima Integrado", desc: "Open-Meteo + NASA POWER", color: "cyan" },
              { icon: MapPin, title: "ZARC", desc: "Janelas de plantio oficiais", color: "rose" },
              { icon: TrendingUp, title: "Preços Agrícolas", desc: "Referências de mercado", color: "indigo" },
              { icon: RefreshCw, title: "Replanejamento", desc: "Ajustes por imprevistos", color: "emerald" },
              { icon: Settings, title: "Modo Avançado", desc: "Módulos configuráveis", color: "blue" },
            ].map((feature, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800/50 p-5 hover:border-slate-700 transition-colors">
                <div className={`p-2 bg-${feature.color}-500/10 rounded-lg w-fit mb-3`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-500`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-50 mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Fontes de Dados */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
              <Database className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Fontes de Dados</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                O sistema integra múltiplas fontes de dados para fornecer referências e estimativas.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Cloud className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">Open-Meteo</h3>
                  <p className="text-xs text-slate-400">Previsão meteorológica de curto prazo (0-16 dias)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-cyan-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">NASA POWER</h3>
                  <p className="text-xs text-slate-400">Climatologia histórica de longo prazo (17+ dias)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">ZARC/MAPA</h3>
                  <p className="text-xs text-slate-400">Referência de zoneamento agrícola oficial</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">Índice de Preços</h3>
                  <p className="text-xs text-slate-400">Referência experimental de mercado regional</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">Base Interna</h3>
                  <p className="text-xs text-slate-400">Culturas, talhões e regras agronômicas</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>Importante:</strong> Todos os dados são usados como referência e estimativa para apoio à decisão, 
              não como valores definitivos ou garantidos.
            </p>
          </div>
        </Card>

        {/* Tecnologias */}
        <div>
          <h2 className="text-2xl font-bold text-slate-50 mb-6">Tecnologias Utilizadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Frontend */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Palette className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">Frontend</h3>
              </div>
              <ul className="space-y-2">
                {["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Recharts", "Lucide Icons"].map((tech, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {tech}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Backend */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Server className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">Backend</h3>
              </div>
              <ul className="space-y-2">
                {["FastAPI", "Python 3.13", "Pydantic", "PyGAD", "Pandas", "NumPy"].map((tech, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {tech}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Dados */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">Dados</h3>
              </div>
              <ul className="space-y-2">
                {["Open-Meteo", "NASA POWER", "ZARC", "Cache Local", "JSON Storage"].map((tech, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {tech}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Deploy */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <GitBranch className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">Deploy</h3>
              </div>
              <ul className="space-y-2">
                {["Vercel", "Render", "CLI própria", "GitHub", "npm"].map((tech, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {tech}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Como funciona a IA */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-lg shrink-0">
              <Code2 className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Como a Otimização Funciona</h2>
              <div className="space-y-3 text-slate-300 leading-relaxed">
                <p>
                  O sistema usa <strong className="text-slate-50">Algoritmo Genético</strong> para testar 
                  combinações de culturas nos talhões, considerando múltiplos fatores:
                </p>
                
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                    <span className="text-sm">Lucro estimado baseado em preços de referência</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                    <span className="text-sm">Risco climático e compatibilidade com ZARC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                    <span className="text-sm">Diversidade de culturas para reduzir risco</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                    <span className="text-sm">Objetivo escolhido (equilibrado, lucro, risco, sustentável)</span>
                  </li>
                </ul>
                
                <p className="text-sm text-slate-400 mt-4">
                  Os resultados são <strong>simulações e estimativas</strong>, não garantias. 
                  A validação e comparação ajudam a entender a estabilidade e confiabilidade das recomendações.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Limitações */}
        <Card className="bg-rose-500/5 border-rose-500/20 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-rose-500/10 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Limitações e Cuidados</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                É fundamental entender as limitações do sistema para uso adequado:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Não substitui assistência técnica ou agronômica profissional",
              "Preços são referências experimentais, não valores de mercado garantidos",
              "Clima de longo prazo é climatologia histórica, não previsão exata",
              "API Render pode dormir no plano free (tempo de resposta inicial lento)",
              "Dados locais em JSON não são banco de dados definitivo",
              "Recomendações devem ser validadas em campo com técnico",
              "Defensivos, pragas e doenças exigem avaliação especializada",
              "Sistema é ferramenta de apoio, decisão final é do produtor/técnico",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Estado Atual */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Estado Atual do Produto</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                MVP funcional com módulos principais implementados e testados.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              "MVP Funcional",
              "Planejamento de Safra",
              "Clima Integrado",
              "ZARC",
              "Preços Agrícolas",
              "Replanejamento",
              "Modo Avançado Modular",
              "Landing Page",
              "CLI Local",
              "Validação com Performance",
              "Comparação de Mercado",
            ].map((badge, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
        </Card>

        {/* Próximas Evoluções */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
              <Leaf className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-3">Próximas Evoluções (Backlog)</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Funcionalidades planejadas para versões futuras:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Mapa/desenho de terreno",
              "Persistência com banco de dados",
              "Autenticação de usuários",
              "Mais culturas na base",
              "Fontes oficiais de preços",
              "Exportação de relatórios PDF",
              "Sistema de notificações",
              "Painel mobile responsivo",
              "Integração com IoT agrícola",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                {item}
              </div>
            ))}
          </div>
        </Card>

        {/* CTA Final */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-50 mb-4">
            Explore o AgroPlan AI
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Comece a usar as ferramentas de planejamento agrícola e descubra como o sistema pode apoiar suas decisões
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Abrir Dashboard
              </Button>
            </Link>
            
            <Link href="/planejamento">
              <Button variant="outline" className="border-slate-700 bg-slate-800/30 text-slate-200 hover:bg-slate-800/50">
                <Calendar className="w-4 h-4 mr-2" />
                Planejar Safra
              </Button>
            </Link>
            
            <Link href="/configuracoes">
              <Button variant="outline" className="border-slate-700 bg-slate-800/30 text-slate-200 hover:bg-slate-800/50">
                <Settings className="w-4 h-4 mr-2" />
                Ver Configurações
              </Button>
            </Link>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>AgroPlan AI - Sistema de apoio à decisão agrícola</p>
          <p className="mt-1">Versão 1.0.44 - CLI disponível via npm</p>
        </div>
      </div>
    </div>
  );
}
