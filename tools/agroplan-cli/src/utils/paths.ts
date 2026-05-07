#!/usr/bin/env bun
import { join, dirname } from "path";
import { existsSync } from "fs";

/**
 * Utilitários para gerenciar caminhos do projeto
 */

export function findProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Procura pela raiz do projeto (onde está o backend/)
  while (currentDir !== dirname(currentDir)) {
    const backendPath = join(currentDir, "backend");
    const apiPath = join(backendPath, "api.py");
    
    if (existsSync(backendPath) && existsSync(apiPath)) {
      return currentDir;
    }
    
    currentDir = dirname(currentDir);
  }
  
  throw new Error("Não foi possível encontrar a raiz do projeto AgroPlan AI");
}

export function getProjectPaths() {
  const root = findProjectRoot();
  
  return {
    root,
    backend: join(root, "backend"),
    api: join(root, "backend", "api.py"),
    requirements: join(root, "backend", "requirements.txt"),
    venv: join(root, "backend", ".venv"),
    agroplanDir: join(root, ".agroplan"),
    pidFile: join(root, ".agroplan", "agroplan-api.pid"),
    logsDir: join(root, ".agroplan", "logs"),
    logFile: join(root, ".agroplan", "logs", "api.log")
  };
}

export function ensureAgroplanDir() {
  const paths = getProjectPaths();
  
  // Cria .agroplan se não existir
  if (!existsSync(paths.agroplanDir)) {
    Bun.spawnSync(["mkdir", "-p", paths.agroplanDir]);
  }
  
  // Cria logs se não existir
  if (!existsSync(paths.logsDir)) {
    Bun.spawnSync(["mkdir", "-p", paths.logsDir]);
  }
}