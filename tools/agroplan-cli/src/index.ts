#!/usr/bin/env bun

/**
 * AgroPlan AI - CLI Local
 * 
 * Launcher e orquestrador para o backend FastAPI local
 * Mantém o Render como fallback universal
 */

import { doctorCommand } from "./commands/doctor";
import { serveOnCommand, serveOffCommand, serveStatusCommand, serveLogsCommand } from "./commands/serve";
import { openCommand } from "./commands/open";
import { setupCommand } from "./commands/setup";
import { updateCommand } from "./commands/update";

const packageJson = await Bun.file(new URL("../package.json", import.meta.url)).json() as { version: string };
const CLI_VERSION = packageJson.version;

const COMMANDS = {
  setup: "Configura a API local no seu computador",
  "setup --force": "Reinstala a API local (remove instalação anterior)",
  "setup --python=<path>": "Usa Python específico para instalação",
  update: "Atualiza a API local para a versão mais recente",
  doctor: "Verifica se o sistema está configurado corretamente",
  "serve on": "Inicia a API local em http://localhost:8000",
  "serve off": "Para a API local",
  "serve status": "Mostra o status da API local e Render",
  "serve logs": "Exibe os logs da API local",
  open: "Abre o AgroPlan AI no navegador"
};

function showHelp(): void {
  console.log(`🌱 AgroPlan AI - CLI Local v${CLI_VERSION}`);
  console.log("   Launcher para modo local acelerado\n");
  
  console.log("📋 Comandos disponíveis:");
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`   agroplan ${cmd.padEnd(20)} # ${desc}`);
  });
  
  console.log("\n🎯 Fluxo recomendado:");
  console.log("   1. agroplan setup           # Configurar API local");
  console.log("   2. agroplan serve on        # Iniciar API local");
  console.log("   3. agroplan open            # Abrir no navegador");
  console.log("   4. agroplan serve off       # Parar quando terminar");
  
  console.log("\n🔄 Atualização:");
  console.log("   agroplan update             # Atualizar API local");
  
  console.log("\n🐍 Para Python 3.13 (Windows):");
  console.log("   agroplan setup --python=\"C:\\Python311\\python.exe\"");
  
  console.log("\n💡 Modo híbrido:");
  console.log("   • API Local: Rápida, não dorme, ideal para uso diário");
  console.log("   • API Render: Fallback universal, funciona em qualquer PC");
  console.log("   • Frontend detecta automaticamente qual usar");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  // Processar argumentos
  let command = "";
  let pythonPath: string | undefined;
  let force = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--python=")) {
      pythonPath = arg.split("=")[1];
    } else if (arg === "--force") {
      force = true;
    } else {
      command += (command ? " " : "") + arg;
    }
  }
  
  try {
    switch (command) {
      case "setup":
        await setupCommand(force, pythonPath);
        break;
      
      case "update":
        await updateCommand();
        break;
        
      case "doctor":
        await doctorCommand();
        break;
        
      case "serve on":
        await serveOnCommand();
        break;
        
      case "serve off":
        await serveOffCommand();
        break;
        
      case "serve status":
        await serveStatusCommand();
        break;
        
      case "serve logs":
        serveLogsCommand();
        break;
        
      case "open":
        openCommand();
        break;
        
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;

      case "--version":
      case "-v":
        console.log(CLI_VERSION);
        break;
        
      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        console.log("\n💡 Use 'agroplan help' para ver comandos disponíveis");
        process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Erro ao executar comando: ${error}`);
    process.exit(1);
  }
}

// Executar CLI
main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
