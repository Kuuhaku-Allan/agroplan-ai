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
  let currentVersion = "1.0.20";
  try {
    const packagePath = require.resolve('agroplan-ai-cli/package.json');
    const packageJson = require(packagePath);
    currentVersion = packageJson.version || "1.0.20";
  } catch {
    currentVersion = "1.0.20";
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
  
  // Passo 2: Reinstalar com --force
  console.log("2️⃣ Reinstalando backend atualizado...\n");
  
  const pythonPath = setupState.pythonPath || undefined;
  
  await setupCommand(true, pythonPath);
  
  // Passo 3: Informar sobre reiniciar
  console.log("\n3️⃣ Atualização concluída!");
  
  if (isRunning) {
    console.log("\n💡 Para reiniciar a API:");
    console.log("   agroplan serve on");
  } else {
    console.log("\n💡 Para iniciar a API:");
    console.log("   agroplan serve on");
  }
}
