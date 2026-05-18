"""
Script de teste de performance para Validação e Relatórios
Mede tempo de execução dos endpoints mais pesados
"""

import time
import requests
from typing import Dict, Any

API_URL = "http://localhost:8000"

def medir_tempo(nome: str, func, *args, **kwargs) -> float:
    """Mede tempo de execução de uma função"""
    print(f"\n{'='*60}")
    print(f"Testando: {nome}")
    print(f"{'='*60}")
    
    inicio = time.time()
    try:
        resultado = func(*args, **kwargs)
        fim = time.time()
        tempo = fim - inicio
        
        print(f"✓ Sucesso em {tempo:.2f}s")
        return tempo
    except Exception as e:
        fim = time.time()
        tempo = fim - inicio
        print(f"✗ Erro em {tempo:.2f}s: {e}")
        return tempo

def test_validar():
    """Testa POST /validar"""
    response = requests.post(
        f"{API_URL}/validar",
        json={"objetivo": "equilibrado", "seed": 42},
        timeout=300
    )
    response.raise_for_status()
    return response.json()

def test_rodadas(rodadas: int):
    """Testa POST /rodadas"""
    response = requests.post(
        f"{API_URL}/rodadas",
        json={"objetivo": "equilibrado", "rodadas": rodadas},
        timeout=600
    )
    response.raise_for_status()
    return response.json()

def test_relatorio_simples():
    """Testa POST /relatorio sem clima/ZARC"""
    response = requests.post(
        f"{API_URL}/relatorio",
        json={"objetivo": "equilibrado", "formato": "md"},
        timeout=600
    )
    response.raise_for_status()
    return response.json()

def test_relatorio_completo():
    """Testa POST /relatorio com clima/ZARC"""
    response = requests.post(
        f"{API_URL}/relatorio",
        json={
            "objetivo": "equilibrado",
            "formato": "md",
            "uf": "SP",
            "municipio": "Clementina"
        },
        timeout=600
    )
    response.raise_for_status()
    return response.json()

def main():
    print("\n" + "="*60)
    print("BASELINE DE PERFORMANCE - VALIDAÇÃO E RELATÓRIOS")
    print("="*60)
    
    resultados = {}
    
    # Teste 1: /validar
    resultados["validar"] = medir_tempo(
        "POST /validar (força bruta)",
        test_validar
    )
    
    # Teste 2: /rodadas com 3 rodadas
    resultados["rodadas_3"] = medir_tempo(
        "POST /rodadas (3 rodadas)",
        test_rodadas,
        3
    )
    
    # Teste 3: /rodadas com 5 rodadas
    resultados["rodadas_5"] = medir_tempo(
        "POST /rodadas (5 rodadas)",
        test_rodadas,
        5
    )
    
    # Teste 4: /rodadas com 10 rodadas
    resultados["rodadas_10"] = medir_tempo(
        "POST /rodadas (10 rodadas)",
        test_rodadas,
        10
    )
    
    # Teste 5: /relatorio simples
    resultados["relatorio_simples"] = medir_tempo(
        "POST /relatorio (sem clima/ZARC)",
        test_relatorio_simples
    )
    
    # Teste 6: /relatorio completo
    resultados["relatorio_completo"] = medir_tempo(
        "POST /relatorio (com clima/ZARC)",
        test_relatorio_completo
    )
    
    # Resumo
    print("\n" + "="*60)
    print("RESUMO DOS TEMPOS (BASELINE)")
    print("="*60)
    for nome, tempo in resultados.items():
        print(f"{nome:30s}: {tempo:6.2f}s")
    
    print("\n" + "="*60)
    print("ANÁLISE")
    print("="*60)
    
    # Análise de rodadas
    if "rodadas_3" in resultados and "rodadas_5" in resultados and "rodadas_10" in resultados:
        tempo_por_rodada_3 = resultados["rodadas_3"] / 3
        tempo_por_rodada_5 = resultados["rodadas_5"] / 5
        tempo_por_rodada_10 = resultados["rodadas_10"] / 10
        
        print(f"\nTempo médio por rodada:")
        print(f"  3 rodadas:  {tempo_por_rodada_3:.2f}s/rodada")
        print(f"  5 rodadas:  {tempo_por_rodada_5:.2f}s/rodada")
        print(f"  10 rodadas: {tempo_por_rodada_10:.2f}s/rodada")
    
    # Metas
    print(f"\nMetas de otimização:")
    print(f"  /rodadas (10 rodadas): ~10s (atual: {resultados.get('rodadas_10', 0):.2f}s)")
    print(f"  /relatorio simples: <15s (atual: {resultados.get('relatorio_simples', 0):.2f}s)")
    
    return resultados

if __name__ == "__main__":
    try:
        # Verificar se API está rodando
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ API não está respondendo corretamente")
            exit(1)
        
        print("✓ API está rodando")
        
        # Executar testes
        resultados = main()
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: API não está rodando em http://localhost:8000")
        print("   Execute: cd backend && python main.py")
        exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Testes interrompidos pelo usuário")
        exit(1)
