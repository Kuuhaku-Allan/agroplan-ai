#!/usr/bin/env bun
import { spawn } from "child_process";

/**
 * Comando para abrir o AgroPlan AI no navegador
 */

export function openCommand(): void {
  console.log("🌐 Abrindo AgroPlan AI no navegador...\n");
  
  const url = "https://agroplan-ai.vercel.app/dashboard";
  
  try {
    let command: string;
    let args: string[];
    
    // Detectar sistema operacional e usar comando apropriado
    switch (process.platform) {
      case "win32":
        command = "cmd";
        args = ["/c", "start", url];
        break;
      case "darwin":
        command = "open";
        args = [url];
        break;
      default: // Linux e outros
        command = "xdg-open";
        args = [url];
        break;
    }
    
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore"
    });
    
    child.unref();
    
    console.log("✅ Navegador aberto!");
    console.log(`   URL: ${url}`);
    console.log("\n💡 O frontend detectará automaticamente se a API local está rodando");
    
  } catch (error) {
    console.log("❌ Erro ao abrir navegador");
    console.log(`   Abra manualmente: ${url}`);
  }
}