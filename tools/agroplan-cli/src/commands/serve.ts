#!/usr/bin/env bun
import { existsSync, readFileSync } from "fs";
import { spawn } from "child_process";
import { getProjectPaths, ensureAgroplanDir } from "../utils/paths";
import { createVenv, installRequirements, getVenvPython } from "../utils/python";
import { savePid, readPid, removePidFile, isProcessRunning, killProcess, checkPort } from "../utils/process";

/**
 * Comandos para gerenciar o servidor local
 */

export async function serveOnCommand(): Promise<void> {
  console.log("🚀 Iniciando API local do AgroPlan AI...\n");
  
  const paths = getProjectPaths();
  
  // Verificar se setup foi executado (modo global)
  if (!existsSync(paths.backend) || !existsSync(paths.api)) {
    console.log("❌ API local ainda não configurada");
    console.log("\n💡 Execute primeiro:");
    console.log("   agroplan setup");
    console.log("\n   Isso criará a instalação local em:");
    console.log(`   ${paths.backend}`);
    return;
  }
  
  // Verificar se já está rodando
  const existingPid = readPid();
  if (existingPid && isProcessRunning(existingPid)) {
    console.log("✅ API local já está rodando!");
    console.log(`   PID: ${existingPid}`);
    console.log("   URL: http://localhost:8000");
    return;
  }
  
  // Limpar PID file antigo se processo não estiver rodando
  if (existingPid) {
    removePidFile();
  }
  
  ensureAgroplanDir();
  
  // Verificar se ambiente virtual existe
  if (!existsSync(paths.venv)) {
    console.log("❌ Ambiente virtual não encontrado");
    console.log("   Execute: agroplan setup");
    return;
  }
  
  // Verificar se uvicorn existe (não instalar dependências)
  const isWindows = process.platform === "win32";
  const uvicornPath = isWindows 
    ? `${paths.venv}/Scripts/uvicorn.exe`
    : `${paths.venv}/bin/uvicorn`;
  
  if (!existsSync(uvicornPath)) {
    console.log("❌ Dependências não instaladas");
    console.log("   Execute: agroplan setup");
    return;
  }
  
  // Verificar se porta está livre ou se é nossa própria API
  const portInUse = await checkPort(8000);
  if (portInUse) {
    // Tentar verificar se é nossa API
    try {
      const response = await fetch("http://localhost:8000/health", {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && (data.culturas !== undefined || data.talhoes !== undefined)) {
          console.log("✅ API local já está rodando em http://localhost:8000");
          console.log(`   Status: ${data.status}`);
          if (data.culturas !== undefined) console.log(`   Culturas: ${data.culturas}`);
          if (data.talhoes !== undefined) console.log(`   Talhões: ${data.talhoes}`);
          return;
        }
      }
    } catch {
      // Não é nossa API ou não responde
    }
    
    console.log("❌ Porta 8000 está ocupada por outro processo");
    console.log("   Feche o processo ou use outro modo de API");
    return;
  }
  
  // Iniciar servidor
  console.log("🌐 Iniciando servidor uvicorn...");
  
  const child = spawn(uvicornPath, [
    "api:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--log-level", "info"
  ], {
    cwd: paths.backend,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CORS_ORIGINS: "https://agroplan-ai.vercel.app,http://localhost:3000,http://127.0.0.1:3000"
    }
  });
  
  // Salvar PID
  savePid(child.pid!);
  
  // Redirecionar logs
  const logStream = Bun.file(paths.logFile).writer();
  child.stdout?.on("data", (data) => {
    logStream.write(data);
  });
  child.stderr?.on("data", (data) => {
    logStream.write(data);
  });
  
  // Desanexar processo para continuar rodando em background
  child.unref();
  
  // Aguardar um pouco e verificar se iniciou corretamente
  console.log("⏳ Aguardando inicialização...");
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const running = await checkPort(8000);
    if (running) {
      console.log("✅ API local iniciada com sucesso!");
      console.log(`   PID: ${child.pid}`);
      console.log("   URL: http://localhost:8000");
      console.log("   Health: http://localhost:8000/health");
      console.log("\n💡 Use 'agroplan serve off' para parar");
      return;
    }
    
    attempts++;
  }
  
  console.log("❌ Falha ao iniciar API local");
  console.log("   Verifique os logs: agroplan serve logs");
}

export async function serveOffCommand(): Promise<void> {
  console.log("🛑 Parando API local...\n");
  
  const pid = readPid();
  if (!pid) {
    console.log("⚠️  Nenhuma API local encontrada");
    return;
  }
  
  if (!isProcessRunning(pid)) {
    console.log("⚠️  Processo não está rodando");
    removePidFile();
    return;
  }
  
  console.log(`🔄 Encerrando processo ${pid}...`);
  
  if (killProcess(pid)) {
    removePidFile();
    console.log("✅ API local parada com sucesso!");
  } else {
    console.log("❌ Falha ao parar API local");
    console.log("   Tente encerrar manualmente o processo");
  }
}

export async function serveStatusCommand(): Promise<void> {
  console.log("📊 Status da API Local\n");
  
  const pid = readPid();
  const running = pid ? isProcessRunning(pid) : false;
  const portActive = await checkPort(8000);
  
  if (running && portActive) {
    console.log("✅ API Local: ONLINE");
    console.log(`   PID: ${pid}`);
    console.log("   URL: http://localhost:8000");
    
    // Tentar obter informações de health
    try {
      const response = await fetch("http://localhost:8000/health");
      if (response.ok) {
        const data = await response.json();
        console.log(`   Status: ${data.status}`);
        console.log(`   Culturas: ${data.culturas}`);
        console.log(`   Talhões: ${data.talhoes}`);
        console.log(`   Cache items: ${data.cache_items}`);
      }
    } catch {
      console.log("   ⚠️  Health check falhou");
    }
  } else if (pid && !running) {
    console.log("❌ API Local: PROCESSO MORTO");
    console.log(`   PID antigo: ${pid} (não está rodando)`);
    removePidFile();
  } else if (!pid && portActive) {
    console.log("⚠️  API Local: PORTA OCUPADA");
    console.log("   Porta 8000 está em uso por outro processo");
  } else {
    console.log("⭕ API Local: OFFLINE");
  }
  
  // Verificar API do Render
  console.log("\n🌐 API Render:");
  try {
    const response = await fetch("https://agroplan-ai-api.onrender.com/health", {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ ONLINE");
      console.log(`   Cache items: ${data.cache_items}`);
    } else {
      console.log("   ❌ OFFLINE ou com problemas");
    }
  } catch {
    console.log("   ❌ INACESSÍVEL");
  }
}

export function serveLogsCommand(): void {
  console.log("📋 Logs da API Local\n");
  
  const paths = getProjectPaths();
  
  if (!existsSync(paths.logFile)) {
    console.log("⚠️  Arquivo de log não encontrado");
    console.log(`   Esperado em: ${paths.logFile}`);
    return;
  }
  
  try {
    const logs = readFileSync(paths.logFile, "utf-8");
    const lines = logs.split("\n");
    
    // Mostrar últimas 50 linhas
    const recentLines = lines.slice(-50).filter(line => line.trim());
    
    if (recentLines.length === 0) {
      console.log("📄 Log vazio");
      return;
    }
    
    console.log("📄 Últimas linhas do log:");
    console.log("-".repeat(60));
    recentLines.forEach(line => console.log(line));
    console.log("-".repeat(60));
    console.log(`\n💡 Log completo: ${paths.logFile}`);
    
  } catch (error) {
    console.log("❌ Erro ao ler arquivo de log");
    console.log(`   ${error}`);
  }
}