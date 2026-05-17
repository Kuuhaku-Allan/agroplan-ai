"""Teste rápido do bug do moderado"""
import requests

print("=== TESTE DO BUG MODERADO ===\n")

# 1. Criar talhão com moderado
print("1. Criando talhão com relevo MODERADO...")
r1 = requests.post('http://localhost:8000/planejamento/talhoes', json={
    'name': 'Teste Moderado',
    'area_ha': 10,
    'soil_type': 'argiloso',
    'slope': 'moderado',
    'water_availability': 'media',
    'uf': 'SP',
    'municipio': 'Sao Paulo',
    'lat': -23.55,
    'lon': -46.63
})
print(f"   Status: {r1.status_code}")
field_id = r1.json()['id'] if r1.status_code == 200 else None
print(f"   Field ID: {field_id}")
print(f"   Slope salvo: {r1.json().get('slope')}\n")

# 2. Gerar calendário
print("2. Gerando calendário para talhão com MODERADO...")
if field_id:
    r2 = requests.post(
        f'http://localhost:8000/planejamento/talhoes/{field_id}/calendario',
        json={'cultura': 'milho', 'planting_date': '2026-06-20'}
    )
    print(f"   Status: {r2.status_code}")
    if r2.status_code == 200:
        print(f"   Tarefas: {len(r2.json().get('tasks', []))} tarefas")
        print(f"   Cultura: {r2.json().get('cultura')}")
        print(f"   Ciclo: {r2.json().get('cycle_days')} dias\n")
    else:
        print(f"   Erro: {r2.json()}\n")
else:
    r2 = None
    print("   Não foi possível criar talhão\n")

# 3. Limpar
print("3. Limpando...")
if field_id:
    requests.delete(f'http://localhost:8000/planejamento/talhoes/{field_id}')
    print("   Talhão deletado\n")

# Resultado
print("=== RESULTADO ===")
if r2 and r2.status_code == 200:
    print("✅ BUG CORRIGIDO! Talhão com 'moderado' gera calendário sem erro 400")
else:
    print("❌ BUG AINDA EXISTE")
