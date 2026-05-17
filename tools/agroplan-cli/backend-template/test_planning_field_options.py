"""
Script de Teste de Validação de Opções de Planejamento

Testa todas as combinações de:
- soil_type: argiloso, arenoso, misto, siltoso (4 opções)
- slope: plano, suave, moderado, ingreme (4 opções)
- water_availability: baixa, media, alta (3 opções)

Total: 4 x 4 x 3 = 48 combinações

Para cada combinação:
1. Cria um talhão
2. Gera calendário de milho
3. Confirma status 200
4. Deleta talhão ao final
"""

import requests
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

# Configuração
API_BASE_URL = "http://localhost:8000"
CULTURA_TESTE = "milho"

# Opções a testar
SOIL_TYPES = ["argiloso", "arenoso", "misto", "siltoso"]
SLOPES = ["plano", "suave", "moderado", "ingreme"]
WATER_AVAILABILITIES = ["baixa", "media", "alta"]

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text: str):
    """Imprime cabeçalho formatado"""
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{text.center(80)}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}\n")


def print_success(text: str):
    """Imprime mensagem de sucesso"""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text: str):
    """Imprime mensagem de erro"""
    print(f"{RED}✗ {text}{RESET}")


def print_info(text: str):
    """Imprime mensagem informativa"""
    print(f"{YELLOW}ℹ {text}{RESET}")


def criar_talhao(soil_type: str, slope: str, water_availability: str) -> Tuple[bool, str, Dict]:
    """
    Cria um talhão de teste.
    
    Returns:
        (sucesso, field_id, response_data)
    """
    payload = {
        "name": f"Teste_{soil_type}_{slope}_{water_availability}",
        "area_ha": 10.0,
        "soil_type": soil_type,
        "slope": slope,
        "water_availability": water_availability,
        "uf": "SP",
        "municipio": "São Paulo",
        "lat": -23.55,
        "lon": -46.63
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/planejamento/talhoes", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return True, data.get("id"), data
        else:
            return False, "", {"error": response.text, "status_code": response.status_code}
    except Exception as e:
        return False, "", {"error": str(e)}


def gerar_calendario(field_id: str, cultura: str) -> Tuple[bool, Dict]:
    """
    Gera calendário para um talhão.
    
    Returns:
        (sucesso, response_data)
    """
    # Data de plantio: 30 dias no futuro
    planting_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    payload = {
        "cultura": cultura,
        "planting_date": planting_date,
        "usar_clima": False
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/planejamento/talhoes/{field_id}/calendario",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, {"error": response.text, "status_code": response.status_code}
    except Exception as e:
        return False, {"error": str(e)}


def deletar_talhao(field_id: str) -> bool:
    """
    Deleta um talhão.
    
    Returns:
        sucesso
    """
    try:
        response = requests.delete(f"{API_BASE_URL}/planejamento/talhoes/{field_id}", timeout=10)
        return response.status_code == 200
    except Exception:
        return False


def testar_combinacao(soil_type: str, slope: str, water_availability: str) -> Tuple[bool, str]:
    """
    Testa uma combinação específica.
    
    Returns:
        (sucesso, mensagem_erro)
    """
    field_id = None
    
    try:
        # 1. Criar talhão
        sucesso, field_id, data = criar_talhao(soil_type, slope, water_availability)
        
        if not sucesso:
            return False, f"Falha ao criar talhão: {data.get('error', 'Erro desconhecido')}"
        
        # 2. Gerar calendário
        sucesso, data = gerar_calendario(field_id, CULTURA_TESTE)
        
        if not sucesso:
            return False, f"Falha ao gerar calendário: {data.get('error', 'Erro desconhecido')}"
        
        # 3. Validar resposta
        if "tasks" not in data:
            return False, "Resposta não contém 'tasks'"
        
        if len(data["tasks"]) == 0:
            return False, "Calendário não contém tarefas"
        
        return True, ""
        
    finally:
        # 4. Limpar: deletar talhão
        if field_id:
            deletar_talhao(field_id)


def testar_todas_combinacoes():
    """Testa todas as 48 combinações"""
    print_header("TESTE DE VALIDAÇÃO DE OPÇÕES DE PLANEJAMENTO")
    
    print_info(f"API Base URL: {API_BASE_URL}")
    print_info(f"Cultura de teste: {CULTURA_TESTE}")
    print_info(f"Total de combinações: {len(SOIL_TYPES)} x {len(SLOPES)} x {len(WATER_AVAILABILITIES)} = {len(SOIL_TYPES) * len(SLOPES) * len(WATER_AVAILABILITIES)}")
    
    # Verificar se API está disponível
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print_error("API não está disponível. Verifique se o backend está rodando.")
            sys.exit(1)
    except Exception as e:
        print_error(f"Não foi possível conectar à API: {e}")
        sys.exit(1)
    
    print_success("API está disponível\n")
    
    # Testar todas as combinações
    resultados = []
    total = len(SOIL_TYPES) * len(SLOPES) * len(WATER_AVAILABILITIES)
    contador = 0
    
    for soil_type in SOIL_TYPES:
        for slope in SLOPES:
            for water_availability in WATER_AVAILABILITIES:
                contador += 1
                combinacao = f"{soil_type}/{slope}/{water_availability}"
                
                print(f"[{contador}/{total}] Testando: {combinacao}...", end=" ")
                
                sucesso, erro = testar_combinacao(soil_type, slope, water_availability)
                
                if sucesso:
                    print_success("OK")
                    resultados.append((combinacao, True, ""))
                else:
                    print_error(f"FALHOU - {erro}")
                    resultados.append((combinacao, False, erro))
    
    # Resumo
    print_header("RESUMO DOS TESTES")
    
    sucessos = sum(1 for _, sucesso, _ in resultados if sucesso)
    falhas = total - sucessos
    
    print(f"Total de combinações testadas: {total}")
    print_success(f"Sucessos: {sucessos}")
    
    if falhas > 0:
        print_error(f"Falhas: {falhas}\n")
        
        print("Combinações que falharam:")
        for combinacao, sucesso, erro in resultados:
            if not sucesso:
                print_error(f"  {combinacao}: {erro}")
        
        sys.exit(1)
    else:
        print_success("Todas as combinações passaram! ✓\n")
        sys.exit(0)


def testar_todas_culturas():
    """Testa todas as 10 culturas com uma combinação padrão"""
    print_header("TESTE DE TODAS AS CULTURAS")
    
    culturas = ["soja", "milho", "feijao", "cafe", "cana", "arroz", "trigo", "sorgo", "mandioca", "algodao"]
    
    # Combinação padrão
    soil_type = "argiloso"
    slope = "plano"
    water_availability = "media"
    
    print_info(f"Combinação padrão: {soil_type}/{slope}/{water_availability}")
    print_info(f"Total de culturas: {len(culturas)}\n")
    
    resultados = []
    
    for i, cultura in enumerate(culturas, 1):
        print(f"[{i}/{len(culturas)}] Testando cultura: {cultura}...", end=" ")
        
        field_id = None
        
        try:
            # Criar talhão
            sucesso, field_id, data = criar_talhao(soil_type, slope, water_availability)
            
            if not sucesso:
                print_error(f"FALHOU - Erro ao criar talhão: {data.get('error')}")
                resultados.append((cultura, False, f"Erro ao criar talhão: {data.get('error')}"))
                continue
            
            # Gerar calendário
            planting_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            payload = {
                "cultura": cultura,
                "planting_date": planting_date,
                "usar_clima": False
            }
            
            response = requests.post(
                f"{API_BASE_URL}/planejamento/talhoes/{field_id}/calendario",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                print_success("OK")
                resultados.append((cultura, True, ""))
            else:
                print_error(f"FALHOU - Status {response.status_code}")
                resultados.append((cultura, False, f"Status {response.status_code}: {response.text}"))
        
        except Exception as e:
            print_error(f"FALHOU - {str(e)}")
            resultados.append((cultura, False, str(e)))
        
        finally:
            # Limpar
            if field_id:
                deletar_talhao(field_id)
    
    # Resumo
    print_header("RESUMO - CULTURAS")
    
    sucessos = sum(1 for _, sucesso, _ in resultados if sucesso)
    falhas = len(culturas) - sucessos
    
    print(f"Total de culturas testadas: {len(culturas)}")
    print_success(f"Sucessos: {sucessos}")
    
    if falhas > 0:
        print_error(f"Falhas: {falhas}\n")
        
        print("Culturas que falharam:")
        for cultura, sucesso, erro in resultados:
            if not sucesso:
                print_error(f"  {cultura}: {erro}")
        
        sys.exit(1)
    else:
        print_success("Todas as culturas passaram! ✓\n")
        sys.exit(0)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Teste de validação de opções de planejamento")
    parser.add_argument(
        "--mode",
        choices=["combinacoes", "culturas", "all"],
        default="all",
        help="Modo de teste: combinacoes (48 combinações), culturas (10 culturas), all (ambos)"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="URL base da API (padrão: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    API_BASE_URL = args.api_url
    
    if args.mode == "combinacoes":
        testar_todas_combinacoes()
    elif args.mode == "culturas":
        testar_todas_culturas()
    else:  # all
        testar_todas_combinacoes()
        print("\n")
        testar_todas_culturas()
