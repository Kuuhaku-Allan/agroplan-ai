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

const COMMANDS = {
  doctor: "Verifica se o sistema está configurado corretamente",
  "serve on": "Inicia a API local em http://localhost:8000",
  "serve off": "Para a API local",
  "serve status": "Mostra o status da API local e Render",
  "serve logs": "Exibe os logs da API local",
  open: "Abre o AgroPlan AI no navegador"
};

function showHelp(): void {
  console.log("🌱 AgroPlan AI - CLI Local v1.0.0");
  console.log("   Launcher para modo local acelerado\n");
  
  console.log("📋 Comandos disponíveis:");
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`   bun run agroplan ${cmd.padEnd(12)} # ${desc}`);
  });
  
  console.log("\n🎯 Fluxo recomendado:");
  console.log("   1. bun run agroplan doctor      # Verificar sistema");
  console.log("   2. bun run agroplan serve on    # Iniciar API local");
  console.log("   3. bun run agroplan open        # Abrir no navegador");
  console.log("   4. bun run agroplan serve off   # Parar quando terminar");
  
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
  
  const command = args.join(" ");
  
  try {
    switch (command) {
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
        
      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        console.log("\n💡 Use 'bun run agroplan help' para ver comandos disponíveis");
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