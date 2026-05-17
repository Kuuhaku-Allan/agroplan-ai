"use client";

import { useEffect, useRef } from "react";
import { API_ENDPOINTS, getApiMode } from "@/lib/api";

const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutos
const KEEP_ALIVE_STORAGE_KEY = "agroplan_render_keep_alive";

/**
 * Hook para manter a API Render acordada enquanto a aba estiver aberta
 */
export function useRenderKeepAlive() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar se keep-alive está ativado
    const isEnabled =
      typeof window !== "undefined" &&
      localStorage.getItem(KEEP_ALIVE_STORAGE_KEY) === "true";

    if (!isEnabled) {
      return;
    }

    // Função para fazer ping na API Render
    const pingRender = async () => {
      const mode = getApiMode();

      // Só pingar se modo for Render ou Auto
      if (mode === "local") {
        return;
      }

      // Não pingar se a aba estiver oculta (economizar recursos)
      if (document.hidden) {
        return;
      }

      try {
        await fetch(API_ENDPOINTS.renderHealth, {
          cache: "no-store",
        });
        console.debug("[Keep-Alive] Ping enviado para API Render");
      } catch (error) {
        console.debug("[Keep-Alive] Erro ao pingar API Render:", error);
      }
    };

    // Fazer ping inicial
    pingRender();

    // Configurar intervalo
    intervalRef.current = setInterval(pingRender, KEEP_ALIVE_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}

/**
 * Ativa o keep-alive
 */
export function enableRenderKeepAlive(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEEP_ALIVE_STORAGE_KEY, "true");
    // Recarregar a página para ativar o hook
    window.location.reload();
  }
}

/**
 * Desativa o keep-alive
 */
export function disableRenderKeepAlive(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEEP_ALIVE_STORAGE_KEY);
    // Recarregar a página para desativar o hook
    window.location.reload();
  }
}

/**
 * Verifica se o keep-alive está ativado
 */
export function isRenderKeepAliveEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEEP_ALIVE_STORAGE_KEY) === "true";
}
