#!/usr/bin/env bun
import { existsSync } from "fs";
import { checkPython, checkPip } from "../utils/python";
import { getProjectPaths } from "../utils/paths";
import { checkPort } from "../utils/process";
import { isSetupComplete, readSetupState } from "../utils/setup-state";

/**
 * Comando doctor - verifica se tudo está configurado corretamente
 */

export async function doctorCommand(): Promise<void> {
  console.log("🔍 AgroPlan AI - Diagnóstico do Sistema\n");
  
  let allGood = true;
  
  // 1. Verificar Python
  console.log("🐍 Python:");
  const python = checkPython();
  if (python.available) {
    console.log(`   ✅ ${python.version} (${python.path})`);
    
    // Aviso sobre Python 3.13
    if (python.version && python.version.includes("3.13")) {
      console.log("   ⚠️  Python 3.13 detectado. Se a instalação for lenta, use Python 3.11 ou 3.12.");
    }
  } else {
    console.log("   ❌ Python não encontrado");
    console.log("      Instale Python 3.8+ em https://python.org");
    allGood = false;
  }
  
  // 2. Verificar pip
  console.log("\n📦 pip:");
  const pip = checkPip();
  if (pip.available) {
    console.log(`   ✅ ${pip.version}`);
  } else {
    console.log("   ❌ pip não encontrado");
    allGood = false;
  }
  
  // 3. Verificar setup local
  console.log("\n🛠️ Setup Local:");
  const setupComplete = isSetupComplete();
  const setupState = readSetupState();
  
  // Obter versão atual da CLI
  let currentVersion = "1.0.20";
  try {
    const packagePath = require.resolve('agroplan-ai-cli/package.json');
    const packageJson = require(packagePath);
    currentVersion = packageJson.version || "1.0.20";
  } catch {
    currentVersion = "1.0.20";
  }
  
  if (setupComplete && setupState) {
    const installedVersion = setupState.version || "unknown";
    console.log("   ✅ Setup concluído");
    console.log(`   📅 Instalado em: ${new Date(setupState.installedAt).toLocaleString()}`);
    console.log(`   📦 Versão: ${installedVersion}`);
    console.log(`   🐍 Python: ${setupState.python}`);
    
    // Verificar se está desatualizado
    if (installedVersion !== currentVersion) {
      console.log(`\n   ⚠️  API local desatualizada!`);
      console.log(`      Instalada: ${installedVersion}`);
      console.log(`      CLI atual: ${currentVersion}`);
      console.log(`\n      Execute: agroplan update`);
      console.log(`      ou: agroplan setup --force --python="${setupState.pythonPath || 'python'}"`);
      allGood = false;
    }
  } else {
    console.log("   ❌ Setup não concluído");
    console.log("      Execute: agroplan setup");
    allGood = false;
  }
  
  // 4. Verificar estrutura do projeto
  console.log("\n📁 Estrutura do Projeto:");
  try {
    const paths = getProjectPaths();
    
    if (existsSync(paths.backend)) {
      console.log("   ✅ Pasta backend/ encontrada");
    } else {
      console.log("   ❌ Pasta backend/ não encontrada");
      allGood = false;
    }
    
    if (existsSync(paths.api)) {
      console.log("   ✅ Arquivo api.py encontrado");
    } else {
      console.log("   ❌ Arquivo api.py não encontrado");
      allGood = false;
    }
    
    if (existsSync(paths.requirements)) {
      console.log("   ✅ Arquivo requirements.txt encontrado");
    } else {
      console.log("   ❌ Arquivo requirements.txt não encontrado");
      allGood = false;
    }
    
    if (existsSync(paths.venv)) {
      console.log("   ✅ Ambiente virtual (.venv) encontrado");
      
      // Verificar uvicorn
      const isWindows = process.platform === "win32";
      const uvicornPath = isWindows 
        ? `${paths.venv}/Scripts/uvicorn.exe`
        : `${paths.venv}/bin/uvicorn`;
      
      if (existsSync(uvicornPath)) {
        console.log("   ✅ Uvicorn instalado");
      } else {
        console.log("   ❌ Uvicorn não encontrado");
        allGood = false;
      }
    } else {
      console.log("   ❌ Ambiente virtual não encontrado");
      allGood = false;
    }
    
  } catch (error) {
    console.log("   ❌ Erro ao verificar estrutura do projeto");
    console.log(`      ${error}`);
    allGood = false;
  }
  
  // 5. Verificar porta 8000
  console.log("\n🌐 Conectividade:");
  const localRunning = await checkPort(8000);
  if (localRunning) {
    // Tentar verificar se é nossa API
    try {
      const response = await fetch("http://localhost:8000/health", {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && (data.culturas !== undefined || data.talhoes !== undefined)) {
          console.log("   ✅ API local rodando em http://localhost:8000");
          console.log(`      Status: ${data.status}`);
          if (data.culturas !== undefined) console.log(`      Culturas: ${data.culturas}`);
          if (data.talhoes !== undefined) console.log(`      Talhões: ${data.talhoes}`);
          if (data.cache_items !== undefined) console.log(`      Cache items: ${data.cache_items}`);
          
          // Verificar se tem suporte a clima real
          if (data.data_mode) {
            console.log(`      Data mode: ${data.data_mode}`);
            if (data.providers && data.providers.weather) {
              console.log(`      Weather provider: ${data.providers.weather}`);
            }
          } else {
            console.log("      ⚠️  Backend local desatualizado (sem suporte a clima real)");
            console.log("         Rode: agroplan setup --force");
          }
        } else {
          console.log("   ⚠️  Porta 8000 ocupada por outro serviço");
        }
      } else {
        console.log("   ⚠️  Porta 8000 ocupada (não é AgroPlan)");
      }
    } catch {
      console.log("   ⚠️  Porta 8000 ocupada (serviço não identificado)");
    }
  } else {
    console.log("   ⚠️  API local não está rodando");
  }
  
  // 6. Verificar API do Render
  try {
    const renderResponse = await fetch("https://agroplan-ai-api.onrender.com/health", {
      signal: AbortSignal.timeout(5000)
    });
    
    if (renderResponse.ok) {
      const data = await renderResponse.json();
      console.log("   ✅ API Render online");
      console.log(`      Culturas: ${data.culturas}, Talhões: ${data.talhoes}`);
      if (data.cache_items !== undefined) console.log(`      Cache items: ${data.cache_items}`);
    } else {
      console.log("   ⚠️  API Render com problemas");
    }
  } catch {
    console.log("   ❌ API Render não acessível");
  }
  
  // Resumo
  console.log("\n" + "=".repeat(50));
  if (allGood) {
    console.log("✅ Sistema pronto para uso!");
    console.log("\nPróximos passos:");
    console.log("   agroplan serve on    # Iniciar API local");
    console.log("   agroplan open        # Abrir no navegador");
  } else {
    console.log("❌ Alguns problemas foram encontrados");
    console.log("\nCorreja os problemas acima:");
    if (!setupComplete) {
      console.log("   agroplan setup       # Configurar API local");
    }
    console.log("   agroplan doctor      # Verificar novamente");
  }
}