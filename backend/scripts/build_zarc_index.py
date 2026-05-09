"""
Script para construir índice ZARC compacto

Processa o CSV oficial ZARC e gera um índice JSON pequeno
contendo apenas as regiões e culturas de interesse do AgroPlan.

Uso:
    python scripts/build_zarc_index.py
"""
import sys
import os
import json
from datetime import datetime

# Adicionar diretório pai ao path para importar providers
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from providers.zarc_provider import (
    ensure_zarc_file,
    iter_zarc_records,
    normalizar_cultura,
    normalizar_municipio,
    normalizar_uf,
    normalizar_solo,
    mapear_codigo_solo,
    extrair_janelas_plantio,
    escolher_melhor_janela,
    ZARC_CACHE_DIR
)

# Regiões de interesse
REGIOES_INTERESSE = [
    {"uf": "SP", "municipio": "Clementina"},
    {"uf": "SP", "municipio": "São Paulo"},
    {"uf": "SP", "municipio": "Ribeirão Preto"},
    {"uf": "MS", "municipio": "Campo Grande"},
    {"uf": "PR", "municipio": "Londrina"},
    {"uf": "DF", "municipio": "Brasília"},
]

# Culturas de interesse
CULTURAS_INTERESSE = [
    "soja",
    "milho",
    "feijao",
    "trigo",
    "algodao",
    "cafe",
    "cana",
    "arroz",
    "sorgo",
    "mandioca"
]

# Solos de interesse
SOLOS_INTERESSE = ["arenoso", "medio", "argiloso", "misto"]

def build_zarc_index(safra: str = "2025/2026"):
    """
    Constrói índice ZARC compacto
    
    Args:
        safra: Safra para processar
    """
    print(f"🌾 Construindo índice ZARC para safra {safra}...")
    print()
    
    # Garantir que arquivo ZARC existe
    file_info = ensure_zarc_file(safra)
    
    if not file_info:
        print("❌ Erro: Arquivo ZARC não disponível")
        return False
    
    print(f"✅ Arquivo ZARC: {file_info['file_path']}")
    print(f"   Fonte: {file_info['source']}")
    print()
    
    # Normalizar regiões de interesse
    regioes_norm = []
    for regiao in REGIOES_INTERESSE:
        regioes_norm.append({
            "uf": normalizar_uf(regiao["uf"]),
            "municipio": normalizar_municipio(regiao["municipio"]),
            "municipio_original": regiao["municipio"]
        })
    
    # Normalizar culturas de interesse
    culturas_norm = [normalizar_cultura(c) for c in CULTURAS_INTERESSE]
    
    print("📍 Regiões de interesse:")
    for r in regioes_norm:
        print(f"   - {r['municipio_original']}/{r['uf']}")
    print()
    
    print("🌱 Culturas de interesse:")
    for c in CULTURAS_INTERESSE:
        print(f"   - {c}")
    print()
    
    # Processar CSV em streaming
    print("🔄 Processando CSV oficial...")
    
    index_records = {}
    registros_processados = 0
    registros_incluidos = 0
    
    for registro in iter_zarc_records(file_info['file_path']):
        registros_processados += 1
        
        # Mostrar progresso a cada 100k registros
        if registros_processados % 100000 == 0:
            print(f"   Processados: {registros_processados:,} registros...")
        
        # Verificar se é cultura de interesse
        cultura_csv = normalizar_cultura(registro.get("Nome_cultura", ""))
        if cultura_csv not in culturas_norm:
            continue
        
        # Verificar se é região de interesse
        uf_csv = normalizar_uf(registro.get("UF", ""))
        municipio_csv = normalizar_municipio(registro.get("municipio", ""))
        
        regiao_match = None
        for regiao in regioes_norm:
            if uf_csv == regiao["uf"] and municipio_csv == regiao["municipio"]:
                regiao_match = regiao
                break
        
        if not regiao_match:
            continue
        
        # Solo
        solo_codigo = registro.get("Cod_Solo", "")
        solo_nome = mapear_codigo_solo(solo_codigo)
        solo_norm = normalizar_solo(solo_nome)
        
        if solo_norm not in SOLOS_INTERESSE and solo_norm != "desconhecido":
            continue
        
        # Extrair janelas de plantio
        janelas = extrair_janelas_plantio(registro)
        melhor_janela = escolher_melhor_janela(janelas)
        
        if not melhor_janela:
            # Sem janelas válidas, pular
            continue
        
        # Criar chave: UF|municipio|cultura|solo
        chave = f"{uf_csv}|{municipio_csv}|{cultura_csv}|{solo_norm}"
        
        # Se já existe, manter o de menor risco
        if chave in index_records:
            risco_atual = index_records[chave]["risco"]
            risco_novo = melhor_janela["risco_predominante"]
            
            ordem_risco = {"baixo": 1, "medio": 2, "alto": 3}
            
            if ordem_risco.get(risco_novo, 999) < ordem_risco.get(risco_atual, 999):
                # Novo tem risco menor, substituir
                pass
            else:
                # Manter o atual
                continue
        
        # Adicionar ao índice
        index_records[chave] = {
            "source": "zarc-oficial-derived",
            "fallback": False,
            "cultura": registro.get("Nome_cultura"),
            "uf": uf_csv.upper(),
            "municipio": regiao_match["municipio_original"],
            "solo": solo_nome,
            "safra": safra,
            "janela_plantio": {
                "inicio": melhor_janela["inicio"],
                "fim": melhor_janela["fim"]
            },
            "risco": melhor_janela["risco_predominante"],
            "decendios_recomendados": melhor_janela["decendios"],
            "geocodigo": registro.get("geocodigo", ""),
            "encontrado": True,
            "observacao": "Dados derivados da Tábua de Risco oficial do ZARC."
        }
        
        registros_incluidos += 1
    
    print(f"✅ Processamento concluído!")
    print(f"   Total processado: {registros_processados:,} registros")
    print(f"   Incluídos no índice: {registros_incluidos} registros")
    print()
    
    # Criar estrutura do índice
    index = {
        "metadata": {
            "source": "zarc-oficial-derived",
            "safra": safra,
            "generated_at": datetime.now().isoformat(),
            "generated_from": file_info["source"],
            "regions": [f"{r['municipio_original']}/{r['uf']}" for r in regioes_norm],
            "cultures": CULTURAS_INTERESSE,
            "soils": SOLOS_INTERESSE,
            "total_records": registros_incluidos
        },
        "records": index_records
    }
    
    # Salvar índice
    safra_filename = safra.replace("/", "-")
    index_path = os.path.join(ZARC_CACHE_DIR, f"zarc_index_{safra_filename}.json")
    
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    # Calcular tamanho
    size_bytes = os.path.getsize(index_path)
    size_kb = size_bytes / 1024
    
    print(f"💾 Índice salvo em: {index_path}")
    print(f"   Tamanho: {size_kb:.2f} KB")
    print()
    
    # Estatísticas por região
    print("📊 Estatísticas por região:")
    for regiao in regioes_norm:
        count = sum(1 for k in index_records.keys() 
                   if k.startswith(f"{regiao['uf']}|{regiao['municipio']}|"))
        print(f"   {regiao['municipio_original']}/{regiao['uf']}: {count} registros")
    print()
    
    # Estatísticas por cultura
    print("📊 Estatísticas por cultura:")
    for cultura in culturas_norm:
        count = sum(1 for k in index_records.keys() 
                   if f"|{cultura}|" in k)
        print(f"   {cultura}: {count} registros")
    print()
    
    print("✅ Índice ZARC construído com sucesso!")
    return True

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Construir índice ZARC compacto")
    parser.add_argument(
        "--safra",
        default="2025/2026",
        help="Safra para processar (padrão: 2025/2026)"
    )
    
    args = parser.parse_args()
    
    success = build_zarc_index(args.safra)
    
    sys.exit(0 if success else 1)
