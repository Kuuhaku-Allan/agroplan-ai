"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sprout,
  Calendar,
  Cloud,
  TrendingUp,
  MapPin,
  RefreshCw,
  BarChart3,
  Settings,
  CheckCircle2,
  ArrowRight,
  Leaf,
  Database,
  Shield,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold text-slate-50">AgroPlan AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Como Funciona
              </a>
              <a href="#dados" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Dados
              </a>
            </div>
            
            <Link href="/dashboard">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Entrar no App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Planejamento Agrícola Inteligente
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-50 mb-6 leading-tight">
              AgroPlan AI
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-4">
              Planejamento agrícola inteligente com clima, ZARC, preços e calendário de safra
            </p>
            
            <p className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto">
              Uma aplicação para apoiar decisões de plantio, organizar talhões, gerar calendários agrícolas 
              e simular cenários com dados reais e modelos explicáveis.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/planejamento">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6">
                  <Calendar className="w-5 h-5 mr-2" />
                  Planejar Safra
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800/30 text-slate-200 hover:bg-slate-800/50 text-lg px-8 py-6">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Abrir Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-50 mb-4">Funcionalidades</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Ferramentas completas para planejamento e acompanhamento da safra
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-emerald-500/30 transition-all">
              <div className="p-3 bg-emerald-500/10 rounded-lg w-fit mb-4">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Planejamento de Safra</h3>
              <p className="text-sm text-slate-400">
                Cadastro de talhões e geração de calendário agrícola com tarefas por fase
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-blue-500/30 transition-all">
              <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
                <Cloud className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Clima Integrado</h3>
              <p className="text-sm text-slate-400">
                Open-Meteo para previsão de curto prazo e NASA POWER para climatologia
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-amber-500/30 transition-all">
              <div className="p-3 bg-amber-500/10 rounded-lg w-fit mb-4">
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">ZARC</h3>
              <p className="text-sm text-slate-400">
                Janelas de plantio recomendadas baseadas no Zoneamento Agrícola oficial
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-purple-500/30 transition-all">
              <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Preços Agrícolas</h3>
              <p className="text-sm text-slate-400">
                Referências de mercado para estimativa de lucro e comparação de cenários
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-rose-500/30 transition-all">
              <div className="p-3 bg-rose-500/10 rounded-lg w-fit mb-4">
                <RefreshCw className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Replanejamento</h3>
              <p className="text-sm text-slate-400">
                Registre imprevistos e receba sugestões de ajuste com análise de risco
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-cyan-500/30 transition-all">
              <div className="p-3 bg-cyan-500/10 rounded-lg w-fit mb-4">
                <BarChart3 className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Comparação de Mercado</h3>
              <p className="text-sm text-slate-400">
                Avalie planos com base em estimativas de lucro de mercado
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-indigo-500/30 transition-all">
              <div className="p-3 bg-indigo-500/10 rounded-lg w-fit mb-4">
                <Settings className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Modo Avançado</h3>
              <p className="text-sm text-slate-400">
                Configure módulos inteligentes: clima, ZARC, preços, validação e mais
              </p>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-emerald-500/30 transition-all">
              <div className="p-3 bg-emerald-500/10 rounded-lg w-fit mb-4">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Algoritmo Genético</h3>
              <p className="text-sm text-slate-400">
                Otimização inteligente com validação e análise de estabilidade
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-50 mb-4">Como Funciona</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Processo simples para começar seu planejamento agrícola
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: "1", title: "Cadastre Talhões", desc: "Registre seus talhões com características do solo e localização" },
              { step: "2", title: "Escolha Cultura", desc: "Selecione a cultura e objetivo do planejamento" },
              { step: "3", title: "Gere Calendário", desc: "Obtenha calendário agrícola com tarefas e prazos" },
              { step: "4", title: "Acompanhe Clima", desc: "Monitore previsões e ajuste conforme necessário" },
              { step: "5", title: "Replaneje", desc: "Registre imprevistos e receba sugestões de ajuste" },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-emerald-500">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
                {idx < 4 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-emerald-500/30 to-transparent -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data & Transparency Section */}
      <section id="dados" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-50 mb-4">Dados e Transparência</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Fontes de dados confiáveis e modelos explicáveis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-slate-900/50 border-slate-800/50 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
                  <Cloud className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">Open-Meteo & NASA POWER</h3>
                  <p className="text-sm text-slate-400">
                    Previsão de curto prazo (0-16 dias) via Open-Meteo e climatologia de longo prazo via NASA POWER
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
                  <Database className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">ZARC Oficial</h3>
                  <p className="text-sm text-slate-400">
                    Zoneamento Agrícola de Risco Climático baseado em dados oficiais do MAPA
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">Preços de Referência</h3>
                  <p className="text-sm text-slate-400">
                    Estimativas experimentais baseadas em referências de mercado regional
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 rounded-lg shrink-0">
                  <Shield className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">Apoio à Decisão</h3>
                  <p className="text-sm text-slate-400">
                    O sistema apoia decisões, mas não substitui assistência técnica agronômica
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-50 mb-4">Modos de Uso</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Escolha o nível de orientação que melhor se adapta à sua experiência
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Iniciante", desc: "Experiência guiada com explicações detalhadas", color: "emerald" },
              { title: "Intermediário", desc: "Equilíbrio entre orientação e controle", color: "blue" },
              { title: "Avançado", desc: "Módulos configuráveis e controle total", color: "purple" },
              { title: "Manual", desc: "Calendário essencial sem excesso de explicações", color: "amber" },
            ].map((mode, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800/50 p-6 text-center">
                <div className={`inline-flex p-3 bg-${mode.color}-500/10 rounded-lg mb-4`}>
                  <CheckCircle2 className={`w-6 h-6 text-${mode.color}-500`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-50 mb-2">{mode.title}</h3>
                <p className="text-sm text-slate-400">{mode.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 p-12 text-center">
            <h2 className="text-4xl font-bold text-slate-50 mb-4">
              Comece seu Planejamento Agrícola
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Organize seus talhões, gere calendários e acompanhe sua safra com dados reais
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/planejamento">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6">
                  <Calendar className="w-5 h-5 mr-2" />
                  Ir para Planejamento
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800/30 text-slate-200 hover:bg-slate-800/50 text-lg px-8 py-6">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ver Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-500" />
              <span className="text-slate-400">AgroPlan AI</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/sobre" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Sobre
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Dashboard
              </Link>
              <Link href="/planejamento" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Planejamento
              </Link>
            </div>
            
            <p className="text-sm text-slate-500">
              Sistema de apoio à decisão agrícola
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
