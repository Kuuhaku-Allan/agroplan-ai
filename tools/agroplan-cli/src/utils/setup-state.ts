#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getHomeAgroplanDir } from "./paths";

export interface SetupState {
  version: string;
  installedAt: string;
  backendPath: string;
  python: string;
  pythonPath?: string;
  dependenciesInstalled: boolean;
}

export function getSetupStatePath(): string {
  return join(getHomeAgroplanDir(), "setup.json");
}

export function readSetupState(): SetupState | null {
  const statePath = getSetupStatePath();
  
  if (!existsSync(statePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(statePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function saveSetupState(state: SetupState): void {
  const statePath = getSetupStatePath();
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function isSetupComplete(): boolean {
  const state = readSetupState();
  if (!state) return false;
  
  const homeDir = getHomeAgroplanDir();
  const backendDir = join(homeDir, "backend");
  const venvDir = join(backendDir, ".venv");
  
  // Verificar se todos os componentes existem
  const backendExists = existsSync(backendDir);
  const venvExists = existsSync(venvDir);
  
  const isWindows = process.platform === "win32";
  const uvicornPath = isWindows 
    ? join(venvDir, "Scripts", "uvicorn.exe")
    : join(venvDir, "bin", "uvicorn");
  
  const uvicornExists = existsSync(uvicornPath);
  
  return backendExists && venvExists && uvicornExists && state.dependenciesInstalled;
}

export function removeSetupState(): void {
  const statePath = getSetupStatePath();
  if (existsSync(statePath)) {
    try {
      const { unlinkSync } = require("fs");
      unlinkSync(statePath);
    } catch {
      // Ignorar erro se não conseguir remover
    }
  }
}