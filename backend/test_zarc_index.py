"""Test ZARC index lookup"""
from providers.zarc_provider import (
    load_zarc_index,
    buscar_zarc,
    normalizar_cultura,
    normalizar_municipio,
    normalizar_uf
)
import json

print("=" * 80)
print("TESTE DO ÍNDICE ZARC")
print("=" * 80)
print()

# Carregar índice
index = load_zarc_index()

if index:
    print("✅ Índice carregado com sucesso")
    print(f"   Total de registros: {len(index['records'])}")
    print()
    
    # Mostrar algumas chaves
    print("📋 Primeiras 10 chaves do índice:")
    for i, key in enumerate(list(index['records'].keys())[:10], 1):
        print(f"   {i}. {key}")
    print()
    
    # Testar normalização
    print("🔍 Teste de normalização:")
    cultura_norm = normalizar_cultura("soja")
    municipio_norm = normalizar_municipio("Clementina")
    uf_norm = normalizar_uf("SP")
    solo_norm = "argiloso"
    
    test_key = f"{uf_norm}|{municipio_norm}|{cultura_norm}|{solo_norm}"
    print(f"   Chave de teste: {test_key}")
    print(f"   Existe no índice: {test_key in index['records']}")
    print()
    
    # Buscar no índice
    print("🔎 Teste de busca indexada:")
    result = buscar_zarc("soja", "SP", "Clementina", "argiloso", "2025/2026")
    
    if result:
        print(f"   ✅ Encontrado!")
        print(f"   Source: {result.get('source')}")
        print(f"   Fallback: {result.get('fallback')}")
        print(f"   Cultura: {result.get('cultura')}")
        print(f"   Município: {result.get('municipio')}")
        print(f"   Janela: {result.get('janela_plantio')}")
        print(f"   Risco: {result.get('risco')}")
    else:
        print("   ❌ Não encontrado")
    print()
    
    # Testar outras combinações
    print("🧪 Testes adicionais:")
    
    tests = [
        ("feijao", "SP", "Clementina", "argiloso"),
        ("arroz", "PR", "Londrina", "medio"),
        ("trigo", "DF", "Brasília", "argiloso"),
        ("milho", "MS", "Campo Grande", "argiloso"),  # Não deve estar no índice
    ]
    
    for cultura, uf, municipio, solo in tests:
        result = buscar_zarc(cultura, uf, municipio, solo, "2025/2026")
        status = "✅" if result and not result.get("fallback") else "⚠️"
        source = result.get("source") if result else "N/A"
        print(f"   {status} {cultura:10} | {municipio:15}/{uf} | {solo:10} → {source}")
    
else:
    print("❌ Erro ao carregar índice")

print()
print("=" * 80)
