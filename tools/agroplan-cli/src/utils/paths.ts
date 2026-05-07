#!/usr/bin/env bun
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";

/**
 * Utilitários para gerenciar caminhos do projeto
 */

export function getHomeAgroplanDir(): string {
  return join(homedir(), ".agroplan");
}

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
  // Tenta usar diretório home primeiro (modo global)
  const homeDir = getHomeAgroplanDir();
  const homeBackend = join(homeDir, "backend");
  
  if (existsSync(homeBackend)) {
    return {
      root: homeDir,
      backend: homeBackend,
      api: join(homeBackend, "api.py"),
      requirements: join(homeBackend, "requirements.txt"),
      venv: join(homeBackend, ".venv"),
      agroplanDir: homeDir,
      pidFile: join(homeDir, "agroplan-api.pid"),
      logsDir: join(homeDir, "logs"),
      logFile: join(homeDir, "logs", "api.log")
    };
  }
  
  // Fallback para modo desenvolvimento (repositório local)
  try {
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
  } catch {
    // Se não encontrar repositório, usar diretório home mesmo sem backend
    return {
      root: homeDir,
      backend: homeBackend,
      api: join(homeBackend, "api.py"),
      requirements: join(homeBackend, "requirements.txt"),
      venv: join(homeBackend, ".venv"),
      agroplanDir: homeDir,
      pidFile: join(homeDir, "agroplan-api.pid"),
      logsDir: join(homeDir, "logs"),
      logFile: join(homeDir, "logs", "api.log")
    };
  }
}

export function ensureAgroplanDir() {
  const paths = getProjectPaths();
  
  // Cria .agroplan se não existir
  if (!existsSync(paths.agroplanDir)) {
    mkdirSync(paths.agroplanDir, { recursive: true });
  }
  
  // Cria logs se não existir
  if (!existsSync(paths.logsDir)) {
    mkdirSync(paths.logsDir, { recursive: true });
  }
}