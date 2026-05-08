"""
Script de teste para ZARC provider
"""
from providers.zarc_provider import buscar_zarc, inspect_zarc_columns, get_zarc_dataset

print("=" * 60)
print("TESTE ZARC PROVIDER")
print("=" * 60)

# Teste 1: Inspecionar colunas
print("\n1. Inspecionando colunas do CSV...")
colunas = inspect_zarc_columns()

# Teste 2: Verificar dataset
print("\n2. Verificando dataset...")
dataset_info = get_zarc_dataset()
print(f"   Source: {dataset_info['source']}")
print(f"   Fallback: {dataset_info['fallback']}")
print(f"   Registros: {len(dataset_info['records'])}")
if dataset_info['error']:
    print(f"   Error: {dataset_info['error']}")

# Teste 3: Buscar soja SP
print("\n3. Buscando soja em São Paulo...")
resultado = buscar_zarc('soja', 'SP', 'Sao Paulo', 'argiloso')
if resultado:
    print(f"   Source: {resultado['source']}")
    print(f"   Fallback: {resultado['fallback']}")
    print(f"   Cultura: {resultado['cultura']}")
    print(f"   Janela: {resultado['janela_plantio']['inicio']} a {resultado['janela_plantio']['fim']}")
    print(f"   Risco: {resultado['risco']}")
    print(f"   Observação: {resultado['observacao']}")
else:
    print("   Não encontrado")

# Teste 4: Buscar milho PR
print("\n4. Buscando milho em Londrina/PR...")
resultado = buscar_zarc('milho', 'PR', 'Londrina', 'argiloso')
if resultado:
    print(f"   Source: {resultado['source']}")
    print(f"   Fallback: {resultado['fallback']}")
    print(f"   Cultura: {resultado['cultura']}")
    print(f"   Janela: {resultado['janela_plantio']['inicio']} a {resultado['janela_plantio']['fim']}")
    print(f"   Risco: {resultado['risco']}")
else:
    print("   Não encontrado")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
