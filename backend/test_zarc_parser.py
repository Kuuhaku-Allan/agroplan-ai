"""
Script de teste para parser de decêndios ZARC
"""
from providers.zarc_provider import (
    decendio_para_periodo,
    extrair_janelas_plantio,
    escolher_melhor_janela,
    buscar_zarc,
    mapear_codigo_solo
)

print("=" * 60)
print("TESTE PARSER DE DECÊNDIOS ZARC")
print("=" * 60)

# Teste 1: Conversão de decêndios
print("\n1. Testando conversão de decêndios...")
for dec in [1, 2, 3, 10, 20, 30, 36]:
    periodo = decendio_para_periodo(dec)
    print(f"   dec{dec}: {periodo['inicio']} a {periodo['fim']}")

# Teste 2: Mapeamento de solo
print("\n2. Testando mapeamento de solo...")
for cod in ["1", "2", "3"]:
    solo = mapear_codigo_solo(cod)
    print(f"   Código {cod}: {solo}")

# Teste 3: Extração de janelas (simulado)
print("\n3. Testando extração de janelas...")
registro_teste = {
    "dec1": "", "dec2": "", "dec3": "",
    "dec4": "", "dec5": "", "dec6": "",
    "dec7": "", "dec8": "", "dec9": "",
    "dec10": "20", "dec11": "20", "dec12": "20",  # Janela 1: baixo risco (20%)
    "dec13": "30", "dec14": "30",  # Janela 1 continua: médio risco (30%)
    "dec15": "", "dec16": "",
    "dec17": "20", "dec18": "20", "dec19": "20", "dec20": "20",  # Janela 2: baixo risco (20%)
    "dec21": "", "dec22": "", "dec23": "",
    "dec24": "", "dec25": "", "dec26": "",
    "dec27": "", "dec28": "", "dec29": "",
    "dec30": "", "dec31": "", "dec32": "",
    "dec33": "", "dec34": "", "dec35": "", "dec36": ""
}

janelas = extrair_janelas_plantio(registro_teste)
print(f"   Janelas encontradas: {len(janelas)}")
for i, janela in enumerate(janelas, 1):
    print(f"   Janela {i}:")
    print(f"      Período: {janela['inicio']} a {janela['fim']}")
    print(f"      Risco: {janela['risco_predominante']}")
    print(f"      Decêndios: {janela['decendios']}")

if janelas:
    melhor = escolher_melhor_janela(janelas)
    print(f"\n   Melhor janela escolhida:")
    print(f"      Período: {melhor['inicio']} a {melhor['fim']}")
    print(f"      Risco: {melhor['risco_predominante']}")

# Teste 4: Busca ZARC real
print("\n4. Testando busca ZARC com parser...")
print("   Buscando: SOJA em SP...")
resultado = buscar_zarc('soja', 'SP', None, 'argiloso')
if resultado:
    print(f"   Source: {resultado['source']}")
    print(f"   Fallback: {resultado['fallback']}")
    print(f"   Encontrado: {resultado.get('encontrado', True)}")
    if resultado.get('encontrado'):
        print(f"   Cultura: {resultado['cultura']}")
        print(f"   UF: {resultado['uf']}")
        if resultado.get('municipio'):
            print(f"   Município: {resultado['municipio']}")
        print(f"   Solo: {resultado.get('solo', 'N/A')}")
        print(f"   Janela: {resultado['janela_plantio']['inicio']} a {resultado['janela_plantio']['fim']}")
        print(f"   Risco: {resultado['risco']}")
        if resultado.get('decendios_recomendados'):
            print(f"   Decêndios: {resultado['decendios_recomendados']}")
    else:
        print(f"   Mensagem: {resultado.get('message', 'N/A')}")
else:
    print("   Não encontrado")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
