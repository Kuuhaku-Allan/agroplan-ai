#!/usr/bin/env bun
import { existsSync, cpSync } from "fs";
import { join, dirname } from "path";
import { getHomeAgroplanDir, ensureAgroplanDir } from "../utils/paths";
import { createVenv, installRequirements, checkPython } from "../utils/python";

/**
 * Comando setup - configura a API local no diretório home do usuário
 */

export async function setupCommand(): Promise<void> {
  console.log("🛠️ Configurando AgroPlan AI - API Local\n");
  
  const homeDir = getHomeAgroplanDir();
  const backendDir = join(homeDir, "backend");
  
  console.log(`📁 Diretório de instalação: ${homeDir}`);
  
  // Verificar Python
  console.log("\n🐍 Verificando Python...");
  const python = checkPython();
  if (!python.available) {
    console.log("❌ Python não encontrado");
    console.log("   Instale Python 3.8+ em https://python.org/downloads");
    return;
  }
  console.log(`   ✅ ${python.version}`);
  
  // Criar diretório .agroplan
  console.log("\n📂 Criando estrutura de diretórios...");
  ensureAgroplanDir();
  
  // Copiar backend template
  console.log("📋 Copiando arquivos do backend...");
  
  // Encontrar o template do backend (relativo ao executável da CLI)
  const cliDir = dirname(dirname(dirname(import.meta.url.replace('file://', ''))));
  const templateDir = join(cliDir, "backend-template");
  
  if (!existsSync(templateDir)) {
    console.log("❌ Template do backend não encontrado");
    console.log(`   Esperado em: ${templateDir}`);
    console.log("   Reinstale a CLI: bun add -g @kuuhaku-allan/agroplan-cli");
    return;
  }
  
  try {
    // Remove backend existente se houver
    if (existsSync(backendDir)) {
      console.log("   🗑️ Removendo instalação anterior...");
      Bun.spawnSync(["rm", "-rf", backendDir]);
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
  
  const isWindows = process.platform === "win32";
  const pipPath = isWindows 
    ? join(venvPath, "Scripts", "pip.exe")
    : join(venvPath, "bin", "pip");
  
  const installResult = Bun.spawnSync([pipPath, "install", "-r", "requirements.txt"], {
    cwd: backendDir
  });
  
  if (!installResult.success) {
    console.log("❌ Falha ao instalar dependências");
    console.log("   Verifique sua conexão com a internet");
    return;
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
  
  // Sucesso
  console.log("\n" + "=".repeat(50));
  console.log("✅ Configuração concluída com sucesso!");
  console.log("\n🚀 Próximos passos:");
  console.log("   agroplan serve on     # Iniciar API local");
  console.log("   agroplan open         # Abrir no navegador");
  console.log("\n💡 A API local será executada em http://localhost:8000");
}