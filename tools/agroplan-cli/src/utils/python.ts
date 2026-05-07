#!/usr/bin/env bun
import { existsSync } from "fs";
import { getProjectPaths } from "./paths";

/**
 * Utilitários para gerenciar Python e ambiente virtual
 */

export function checkPython(): { available: boolean; version?: string; path?: string } {
  try {
    const result = Bun.spawnSync(["python", "--version"]);
    if (result.success) {
      return {
        available: true,
        version: result.stdout.toString().trim(),
        path: "python"
      };
    }
  } catch {}
  
  try {
    const result = Bun.spawnSync(["python3", "--version"]);
    if (result.success) {
      return {
        available: true,
        version: result.stdout.toString().trim(),
        path: "python3"
      };
    }
  } catch {}
  
  return { available: false };
}

export function checkPip(): { available: boolean; version?: string } {
  try {
    const result = Bun.spawnSync(["pip", "--version"]);
    if (result.success) {
      return {
        available: true,
        version: result.stdout.toString().trim()
      };
    }
  } catch {}
  
  return { available: false };
}

export function createVenv(): boolean {
  const paths = getProjectPaths();
  const python = checkPython();
  
  if (!python.available || !python.path) {
    return false;
  }
  
  try {
    console.log("🐍 Criando ambiente virtual...");
    const result = Bun.spawnSync([python.path, "-m", "venv", ".venv"], {
      cwd: paths.backend
    });
    
    return result.success;
  } catch {
    return false;
  }
}

export function installRequirements(): boolean {
  const paths = getProjectPaths();
  
  if (!existsSync(paths.venv)) {
    console.log("❌ Ambiente virtual não encontrado");
    return false;
  }
  
  try {
    console.log("📦 Instalando dependências...");
    
    // Determina o caminho do pip no venv
    const isWindows = process.platform === "win32";
    const pipPath = isWindows 
      ? `${paths.venv}/Scripts/pip.exe`
      : `${paths.venv}/bin/pip`;
    
    const result = Bun.spawnSync([pipPath, "install", "-r", "requirements.txt"], {
      cwd: paths.backend
    });
    
    return result.success;
  } catch {
    return false;
  }
}

export function getVenvPython(): string | null {
  const paths = getProjectPaths();
  
  if (!existsSync(paths.venv)) {
    return null;
  }
  
  const isWindows = process.platform === "win32";
  const pythonPath = isWindows 
    ? `${paths.venv}/Scripts/python.exe`
    : `${paths.venv}/bin/python`;
  
  return existsSync(pythonPath) ? pythonPath : null;
}