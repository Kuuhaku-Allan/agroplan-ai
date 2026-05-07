#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { getProjectPaths } from "./paths";

/**
 * Utilitários para gerenciar processos do backend
 */

export function savePid(pid: number): void {
  const paths = getProjectPaths();
  writeFileSync(paths.pidFile, pid.toString());
}

export function readPid(): number | null {
  const paths = getProjectPaths();
  
  if (!existsSync(paths.pidFile)) {
    return null;
  }
  
  try {
    const pidStr = readFileSync(paths.pidFile, "utf-8").trim();
    return parseInt(pidStr, 10);
  } catch {
    return null;
  }
}

export function removePidFile(): void {
  const paths = getProjectPaths();
  
  if (existsSync(paths.pidFile)) {
    unlinkSync(paths.pidFile);
  }
}

export function isProcessRunning(pid: number): boolean {
  try {
    // No Windows e Unix, process.kill(pid, 0) não mata o processo,
    // apenas verifica se ele existe
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function killProcess(pid: number): boolean {
  try {
    process.kill(pid, "SIGTERM");
    
    // Aguarda um pouco e verifica se o processo foi encerrado
    setTimeout(() => {
      if (isProcessRunning(pid)) {
        // Se ainda estiver rodando, força o encerramento
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
    }, 2000);
    
    return true;
  } catch {
    return false;
  }
}

export function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(1000)
      })
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } catch {
      resolve(false);
    }
  });
}