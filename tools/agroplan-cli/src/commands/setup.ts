#!/usr/bin/env bun
import { existsSync, cpSync, rmSync } from "fs";
import { join, dirname } from "path";
import { getHomeAgroplanDir, ensureAgroplanDir } from "../utils/paths";
import { createVenv, installRequirements, checkPython } from "../utils/python";
import { isSetupComplete, saveSetupState, removeSetupState } from "../utils/setup-state";

/**
 * Comando setup - configura a API local no diretório home do usuário
 */

export async function setupCommand(force: boolean = false, pythonPath?: string): Promise<void> {
  console.log("🛠️ Configurando AgroPlan AI - API Local\n");
  
  const homeDir = getHomeAgroplanDir();
  const backendDir = join(homeDir, "backend");
  
  console.log(`📁 Diretório de instalação: ${homeDir}`);
  
  // Verificar se já está configurado (a menos que seja --force)
  if (!force && isSetupComplete()) {
    console.log("\n✅ API local já está configurada!");
    console.log("\n🚀 Próximos passos:");
    console.log("   agroplan serve on     # Iniciar API local");
    console.log("   agroplan open         # Abrir no navegador");
    console.log("\n💡 Para reinstalar: agroplan setup --force");
    return;
  }
  
  // Verificar Python
  console.log("\n🐍 Verificando Python...");
  let python;
  
  if (pythonPath) {
    // Usar Python específico fornecido pelo usuário
    console.log(`   🎯 Usando Python específico: ${pythonPath}`);
    
    // Verificar se o executável existe
    if (!existsSync(pythonPath)) {
      console.log("❌ Python especificado não encontrado");
      console.log(`   Caminho: ${pythonPath}`);
      return;
    }
    
    // Verificar versão do Python específico
    const versionResult = Bun.spawnSync([pythonPath, "--version"], {});
    if (!versionResult.success) {
      console.log("❌ Falha ao verificar versão do Python especificado");
      return;
    }
    
    const versionOutput = new TextDecoder().decode(versionResult.stdout);
    python = {
      available: true,
      path: pythonPath,
      version: versionOutput.trim()
    };
  } else {
    // Usar Python do PATH
    python = checkPython();
  }
  
  if (!python.available) {
    console.log("❌ Python não encontrado");
    console.log("   Instale Python 3.8+ em https://python.org/downloads");
    console.log("   Ou use: agroplan setup --python=<caminho>");
    return;
  }
  console.log(`   ✅ ${python.version}`);
  
  // Aviso sobre Python 3.13
  if (python.version && python.version.includes("3.13")) {
    console.log("   ⚠️  Python 3.13 detectado. Se a instalação for lenta, use Python 3.11 ou 3.12.");
    console.log("   💡 Exemplo: agroplan setup --python=\"C:\\Python311\\python.exe\"");
  }
  
  // Criar diretório .agroplan
  console.log("\n📂 Criando estrutura de diretórios...");
  ensureAgroplanDir();
  
  // Copiar backend template
  console.log("📋 Copiando arquivos do backend...");
  
  // Encontrar o template do backend (relativo ao executável da CLI)
  let templateDir: string;
  
  try {
    // Tenta encontrar o diretório do pacote instalado
    const packagePath = require.resolve('agroplan-ai-cli/package.json');
    const packageDir = dirname(packagePath);
    templateDir = join(packageDir, "backend-template");
  } catch {
    // Fallback para caminho relativo ao script atual
    const cliDir = dirname(dirname(dirname(import.meta.url.replace('file://', ''))));
    templateDir = join(cliDir, "backend-template");
  }
  
  if (!existsSync(templateDir)) {
    console.log("❌ Template do backend não encontrado");
    console.log(`   Esperado em: ${templateDir}`);
    console.log("   Reinstale a CLI: bun add -g agroplan-ai-cli");
    return;
  }
  
  try {
    // Remove backend existente se houver
    if (existsSync(backendDir)) {
      console.log("   🗑️ Removendo instalação anterior...");
      rmSync(backendDir, { recursive: true, force: true });
    }
    
    // Copia template
    cpSync(templateDir, backendDir, { recursive: true });
    console.log("   ✅ Arquivos copiados com sucesso");
  } catch (error) {
    console.log("❌ Erro ao copiar arquivos do backend");
    console.log(`   ${error}`);
    return;
  }
  
  // Criar ambiente virtual
  console.log("\n🐍 Criando ambiente virtual...");
  const venvPath = join(backendDir, ".venv");
  
  if (!existsSync(venvPath)) {
    const result = Bun.spawnSync([python.path!, "-m", "venv", ".venv"], {
      cwd: backendDir
    });
    
    if (!result.success) {
      console.log("❌ Falha ao criar ambiente virtual");
      return;
    }
  }
  console.log("   ✅ Ambiente virtual criado");
  
  // Instalar dependências
  console.log("\n📦 Instalando dependências Python...");
  console.log("   💡 Isso pode levar alguns minutos na primeira vez...");
  
  const isWindows = process.platform === "win32";
  const pipPath = isWindows 
    ? join(venvPath, "Scripts", "pip.exe")
    : join(venvPath, "bin", "pip");
  
  // Atualizar pip primeiro
  const upgradeResult = Bun.spawnSync([pipPath, "install", "--upgrade", "pip"], {
    cwd: backendDir
  });
  
  if (!upgradeResult.success) {
    console.log("⚠️  Falha ao atualizar pip, continuando...");
  }
  
  // Instalar dependências com binários pré-compilados quando possível
  const installResult = Bun.spawnSync([pipPath, "install", "--only-binary=:all:", "-r", "requirements.txt"], {
    cwd: backendDir
  });
  
  if (!installResult.success) {
    console.log("   ⚠️  Instalação com binários falhou, tentando instalação normal...");
    
    const fallbackResult = Bun.spawnSync([pipPath, "install", "-r", "requirements.txt"], {
      cwd: backendDir
    });
    
    if (!fallbackResult.success) {
      console.log("❌ Falha ao instalar dependências");
      console.log("   Verifique sua conexão com a internet");
      console.log("   Para dependências científicas, recomendamos Python 3.11 ou 3.12");
      return;
    }
  }
  console.log("   ✅ Dependências instaladas");
  
  // Verificar uvicorn
  console.log("\n🌐 Verificando servidor web...");
  const uvicornPath = isWindows 
    ? join(venvPath, "Scripts", "uvicorn.exe")
    : join(venvPath, "bin", "uvicorn");
  
  if (!existsSync(uvicornPath)) {
    console.log("❌ Uvicorn não encontrado");
    return;
  }
  console.log("   ✅ Servidor web configurado");
  
  // Salvar estado do setup
  let version = "1.0.5";
  try {
    // Tentar encontrar o package.json da CLI instalada
    const packagePath = require.resolve('agroplan-ai-cli/package.json');
    const packageJson = require(packagePath);
    version = packageJson.version || "1.0.5";
  } catch {
    // Fallback para versão hardcoded se não conseguir encontrar
    version = "1.0.5";
  }
  
  saveSetupState({
    version: version,
    installedAt: new Date().toISOString(),
    backendPath: backendDir,
    python: python.version || "unknown",
    pythonPath: python.path || "",
    dependenciesInstalled: true
  });
  
  // Sucesso
  console.log("\n" + "=".repeat(50));
  console.log("✅ Configuração concluída com sucesso!");
  console.log("\n🚀 Próximos passos:");
  console.log("   agroplan serve on     # Iniciar API local");
  console.log("   agroplan open         # Abrir no navegador");
  console.log("\n💡 A API local será executada em http://localhost:8000");
}