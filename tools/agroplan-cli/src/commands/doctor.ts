#!/usr/bin/env bun
import { existsSync } from "fs";
import { checkPython, checkPip } from "../utils/python";
import { getProjectPaths } from "../utils/paths";
import { checkPort } from "../utils/process";

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
  
  // 3. Verificar estrutura do projeto
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
    } else {
      console.log("   ⚠️  Ambiente virtual não encontrado (será criado automaticamente)");
    }
    
  } catch (error) {
    console.log("   ❌ Erro ao verificar estrutura do projeto");
    console.log(`      ${error}`);
    allGood = false;
  }
  
  // 4. Verificar porta 8000
  console.log("\n🌐 Conectividade:");
  const localRunning = await checkPort(8000);
  if (localRunning) {
    console.log("   ✅ API local rodando em http://localhost:8000");
  } else {
    console.log("   ⚠️  API local não está rodando");
  }
  
  // 5. Verificar API do Render
  try {
    const renderResponse = await fetch("https://agroplan-ai-api.onrender.com/health", {
      signal: AbortSignal.timeout(5000)
    });
    
    if (renderResponse.ok) {
      const data = await renderResponse.json();
      console.log("   ✅ API Render online");
      console.log(`      Culturas: ${data.culturas}, Talhões: ${data.talhoes}`);
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
    console.log("   bun run agroplan serve on    # Iniciar API local");
    console.log("   bun run agroplan open        # Abrir no navegador");
  } else {
    console.log("❌ Alguns problemas foram encontrados");
    console.log("\nCorreja os problemas acima e execute novamente:");
    console.log("   bun run agroplan doctor");
  }
}