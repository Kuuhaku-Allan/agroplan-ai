#!/usr/bin/env bun
import { readSetupState, isSetupComplete } from "../utils/setup-state";
import { setupCommand } from "./setup";
import { serveOffCommand } from "./serve";
import { readPid, isProcessRunning } from "../utils/process";

/**
 * Comando update - atualiza a API local para a versão mais recente
 */

export async function updateCommand(): Promise<void> {
  console.log("🔄 Atualizando API local do AgroPlan AI...\n");
  
  // Verificar se setup existe
  if (!isSetupComplete()) {
    console.log("❌ API local não está configurada");
    console.log("\n💡 Execute primeiro:");
    console.log("   agroplan setup");
    return;
  }
  
  // Ler estado do setup para obter Python path
  const setupState = readSetupState();
  
  if (!setupState) {
    console.log("❌ Não foi possível ler estado do setup");
    console.log("\n💡 Execute:");
    console.log("   agroplan setup --force");
    return;
  }
  
  // Obter versões
  let currentVersion = "1.0.21";
  try {
    const packagePath = require.resolve('agroplan-ai-cli/package.json');
    const packageJson = require(packagePath);
    currentVersion = packageJson.version || "1.0.21";
  } catch {
    currentVersion = "1.0.21";
  }
  
  const installedVersion = setupState.version || "unknown";
  
  console.log(`📦 Versão instalada: ${installedVersion}`);
  console.log(`📦 Versão CLI atual: ${currentVersion}\n`);
  
  if (installedVersion === currentVersion) {
    console.log("✅ API local já está atualizada!");
    console.log("\n💡 Para reinstalar mesmo assim:");
    console.log("   agroplan setup --force");
    return;
  }
  
  console.log("🔄 Iniciando atualização...\n");
  
  // Passo 1: Parar API se estiver rodando
  const pid = readPid();
  const isRunning = pid ? isProcessRunning(pid) : false;
  
  if (isRunning) {
    console.log("1️⃣ Parando API local...");
    await serveOffCommand();
    console.log("");
  } else {
    console.log("1️⃣ API local não está rodando");
  }
  
  // Verificar se porta 8000 ainda está ocupada
  const { checkPort } = await import("../utils/process");
  const portInUse = await checkPort(8000);
  
  if (portInUse) {
    console.log("\n⚠️  Porta 8000 ainda está ocupada por outro processo!");
    console.log("\n💡 Para identificar e encerrar o processo:");
    console.log("   netstat -ano | findstr :8000");
    console.log("   taskkill /PID <PID> /F");
    console.log("\n   Depois rode novamente: agroplan update");
    return;
  }
  
  // Passo 2: Remover backend antigo completamente
  console.log("2️⃣ Removendo backend antigo...");
  
  try {
    const { getHomeAgroplanDir } = await import("../utils/paths");
    const { existsSync, rmSync } = await import("fs");
    const { join } = await import("path");
    
    const homeDir = getHomeAgroplanDir();
    const backendDir = join(homeDir, "backend");
    
    if (existsSync(backendDir)) {
      rmSync(backendDir, { recursive: true, force: true });
      console.log("   ✅ Backend antigo removido");
    } else {
      console.log("   ℹ️  Nenhum backend antigo encontrado");
    }
  } catch (error) {
    console.log(`   ⚠️  Erro ao remover backend: ${error}`);
  }
  
  console.log("");
  
  // Passo 3: Reinstalar com --force
  console.log("3️⃣ Instalando backend atualizado...\n");
  
  const pythonPath = setupState.pythonPath || undefined;
  
  await setupCommand(true, pythonPath);
  
  // Passo 4: Verificar versão instalada
  console.log("\n4️⃣ Verificando instalação...");
  
  try {
    const { getHomeAgroplanDir } = await import("../utils/paths");
    const { existsSync, readFileSync } = await import("fs");
    const { join } = await import("path");
    
    const homeDir = getHomeAgroplanDir();
    const versionPath = join(homeDir, "backend", "VERSION.json");
    
    if (existsSync(versionPath)) {
      const versionContent = readFileSync(versionPath, 'utf-8');
      const versionInfo = JSON.parse(versionContent);
      
      console.log(`   ✅ Backend template: ${versionInfo.backend_template_version}`);
      console.log(`   ✅ ZARC index: ${versionInfo.zarc_index_version}`);
      console.log(`   ✅ Features: ${versionInfo.features.length} ativas`);
    } else {
      console.log("   ⚠️  VERSION.json não encontrado");
    }
  } catch (error) {
    console.log(`   ⚠️  Erro ao verificar versão: ${error}`);
  }
  
  // Passo 5: Informar sobre reiniciar
  console.log("\n5️⃣ Atualização concluída!");
  
  if (isRunning) {
    console.log("\n💡 Para reiniciar a API:");
    console.log("   agroplan serve on");
  } else {
    console.log("\n💡 Para iniciar a API:");
    console.log("   agroplan serve on");
  }
  
  console.log("\n🔍 Para verificar a versão da API rodando:");
  console.log("   http://localhost:8000/debug/version");
}
