"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Monitor, 
  Cloud, 
  ChevronDown,
  Settings,
  Zap,
  Globe,
  AlertTriangle
} from "lucide-react";
import { getApiMode, setApiMode, testApiConnection, clearApiCache } from "@/lib/api";

interface ApiModeSelectorProps {
  status: "connected" | "disconnected" | "loading";
  origin?: "local" | "render";
  onRefresh: () => void;
}

export function ApiModeSelector({ status, origin, onRefresh }: ApiModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'auto' | 'local' | 'online'>('auto');
  const [testing, setTesting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    setCurrentMode(getApiMode());
  }, []);

  const handleModeChange = async (mode: 'auto' | 'local' | 'online') => {
    setCurrentMode(mode);
    setApiMode(mode);
    clearApiCache();
    
    // Se selecionou local, testar se está disponível
    if (mode === 'local') {
      setTesting(true);
      try {
        const result = await testApiConnection();
        if (!result.local.online) {
          setShowSetupModal(true);
        }
      } catch (error) {
        setShowSetupModal(true);
      }
      setTesting(false);
    }
    
    setIsOpen(false);
    onRefresh();
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      await testApiConnection();
      onRefresh();
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
    }
    setTesting(false);
  };

  const getBadgeContent = () => {
    if (status === "loading" || testing) {
      return (
        <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-400 cursor-pointer">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Conectando...
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      );
    }

    if (status === "connected" && origin === "local") {
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 cursor-pointer hover:bg-emerald-500/20 transition-colors">
          <Monitor className="w-3 h-3 mr-1" />
          API Local
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      );
    }

    if (status === "connected" && origin === "render") {
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 cursor-pointer hover:bg-blue-500/20 transition-colors">
          <Cloud className="w-3 h-3 mr-1" />
          API Render
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 cursor-pointer hover:bg-red-500/20 transition-colors">
        <XCircle className="w-3 h-3 mr-1" />
        API Offline
        <ChevronDown className="w-3 h-3 ml-1" />
      </Badge>
    );
  };

  return (
    <div className="relative">
      {/* Badge clicável */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {getBadgeContent()}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 z-50">
          <Card className="border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-50 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Modo da API
              </CardTitle>
              <CardDescription className="text-slate-400">
                Escolha como conectar com o backend do AgroPlan AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Automático */}
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentMode === 'auto' 
                    ? 'border-emerald-500/50 bg-emerald-500/10' 
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                }`}
                onClick={() => handleModeChange('auto')}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-50">Automático</div>
                    <div className="text-xs text-slate-400">
                      Usa API Local se disponível, senão Render
                    </div>
                  </div>
                  {currentMode === 'auto' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* API Local */}
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentMode === 'local' 
                    ? 'border-emerald-500/50 bg-emerald-500/10' 
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                }`}
                onClick={() => handleModeChange('local')}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-emerald-500" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-50">API Local</div>
                    <div className="text-xs text-slate-400">
                      Mais rápida, exige servidor local rodando
                    </div>
                  </div>
                  {currentMode === 'local' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* API Render */}
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentMode === 'online' 
                    ? 'border-blue-500/50 bg-blue-500/10' 
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                }`}
                onClick={() => handleModeChange('online')}
              >
                <div className="flex items-center gap-3">
                  <Cloud className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-50">API Render</div>
                    <div className="text-xs text-slate-400">
                      Funciona em qualquer lugar, mas pode acordar lentamente
                    </div>
                  </div>
                  {currentMode === 'online' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2 border-t border-slate-600">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testConnection}
                  disabled={testing}
                  className="flex-1 border-slate-600 hover:bg-slate-700"
                >
                  {testing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Globe className="w-3 h-3 mr-1" />
                  )}
                  Testar Conexão
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Setup da API Local */}
      {showSetupModal && (
        <LocalApiSetupModal 
          onClose={() => setShowSetupModal(false)}
          onTest={testConnection}
          onUseRender={() => {
            handleModeChange('online');
            setShowSetupModal(false);
          }}
        />
      )}

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Modal de Setup da API Local
function LocalApiSetupModal({ 
  onClose, 
  onTest, 
  onUseRender 
}: { 
  onClose: () => void; 
  onTest: () => void; 
  onUseRender: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos'>('windows');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const windowsCommands = [
    {
      step: "1. Instalar Bun",
      command: "powershell -c \"irm bun.sh/install.ps1|iex\"",
      description: "Instala o runtime Bun no Windows"
    },
    {
      step: "2. Instalar AgroPlan CLI",
      command: "bun add -g agroplan-ai-cli",
      description: "Instala a CLI global do AgroPlan"
    },
    {
      step: "3. Configurar API local",
      command: "agroplan setup",
      description: "Configura a API local no seu computador"
    },
    {
      step: "4. Iniciar API local",
      command: "agroplan serve on",
      description: "Inicia o servidor local em localhost:8000"
    },
    {
      step: "5. Abrir aplicação",
      command: "agroplan open",
      description: "Abre o AgroPlan AI no navegador"
    }
  ];

  const macosCommands = [
    {
      step: "1. Instalar Bun",
      command: "curl -fsSL https://bun.com/install | bash",
      description: "Instala o runtime Bun no macOS/Linux"
    },
    {
      step: "2. Instalar AgroPlan CLI",
      command: "bun add -g agroplan-ai-cli",
      description: "Instala a CLI global do AgroPlan"
    },
    {
      step: "3. Configurar API local",
      command: "agroplan setup",
      description: "Configura a API local no seu computador"
    },
    {
      step: "4. Iniciar API local",
      command: "agroplan serve on",
      description: "Inicia o servidor local em localhost:8000"
    },
    {
      step: "5. Abrir aplicação",
      command: "agroplan open",
      description: "Abre o AgroPlan AI no navegador"
    }
  ];

  const commands = activeTab === 'windows' ? windowsCommands : macosCommands;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-slate-700 bg-slate-800 shadow-2xl">
        <CardHeader className="sticky top-0 bg-slate-800 border-b border-slate-700 rounded-t-2xl">
          <CardTitle className="text-slate-50 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-500" />
            Configurar API Local
          </CardTitle>
          <CardDescription className="text-slate-400">
            A API Local evita a espera do Render acordar e deixa o AgroPlan AI mais rápido no uso diário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Requisito do Bun */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 font-medium mb-2">
              <Globe className="w-4 h-4" />
              Requisito
            </div>
            <p className="text-sm text-slate-300">
              Requer <a 
                href="https://bun.sh/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Bun ≥ 1.0
              </a> instalado no seu computador
            </p>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-700/50 rounded-lg">
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'windows'
                  ? 'bg-slate-600 text-slate-50'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('windows')}
            >
              Windows PowerShell
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'macos'
                  ? 'bg-slate-600 text-slate-50'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('macos')}
            >
              macOS/Linux
            </button>
          </div>

          {/* Comandos */}
          <div className="space-y-4">
            {commands.map((cmd, index) => (
              <div key={index} className="space-y-2">
                <div className="font-medium text-slate-50">{cmd.step}</div>
                <div className="text-sm text-slate-400">{cmd.description}</div>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-slate-900 border border-slate-600 rounded-lg text-emerald-400 font-mono text-sm break-all">
                    {cmd.command}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(cmd.command)}
                    className="border-slate-600 hover:bg-slate-700 shrink-0"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Nota importante */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Importante
            </div>
            <p className="text-sm text-slate-300">
              Após executar os comandos, recarregue esta página para que o sistema detecte a API Local automaticamente.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-4 border-t border-slate-600">
            <Button 
              variant="outline" 
              onClick={onTest}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10"
            >
              Testar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={onUseRender}
              className="border-blue-600 text-blue-400 hover:bg-blue-500/10"
            >
              Usar Render por Enquanto
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="ml-auto border-slate-600 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}