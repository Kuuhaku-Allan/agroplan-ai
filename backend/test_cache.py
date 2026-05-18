import requests
import time

print("\n" + "="*60)
print("TESTE DE CACHE")
print("="*60)

# Primeira chamada (sem cache)
print("\n1ª chamada (sem cache):")
start = time.time()
r1 = requests.post('http://localhost:8000/rodadas', json={
    'objetivo': 'equilibrado',
    'rodadas': 10,
    'modo': 'rapido'
})
tempo1 = time.time() - start
print(f"   Tempo: {tempo1:.2f}s")
print(f"   Modo: {r1.json().get('modo')}")
print(f"   Config: {r1.json().get('config')}")
print(f"   Rodadas executadas: {r1.json().get('rodadas_executadas')}")

# Segunda chamada (com cache)
print("\n2ª chamada (com cache):")
start = time.time()
r2 = requests.post('http://localhost:8000/rodadas', json={
    'objetivo': 'equilibrado',
    'rodadas': 10,
    'modo': 'rapido'
})
tempo2 = time.time() - start
print(f"   Tempo: {tempo2:.2f}s")
print(f"   Speedup: {tempo1/tempo2:.1f}x mais rápido")

# Teste modo normal
print("\n3ª chamada (modo normal, sem cache):")
start = time.time()
r3 = requests.post('http://localhost:8000/rodadas', json={
    'objetivo': 'equilibrado',
    'rodadas': 10,
    'modo': 'normal'
})
tempo3 = time.time() - start
print(f"   Tempo: {tempo3:.2f}s")
print(f"   Config: {r3.json().get('config')}")

# Teste modo completo
print("\n4ª chamada (modo completo, sem cache):")
start = time.time()
r4 = requests.post('http://localhost:8000/rodadas', json={
    'objetivo': 'equilibrado',
    'rodadas': 10,
    'modo': 'completo'
})
tempo4 = time.time() - start
print(f"   Tempo: {tempo4:.2f}s")
print(f"   Config: {r4.json().get('config')}")

print("\n" + "="*60)
print("RESUMO")
print("="*60)
print(f"Modo rápido (1ª vez):  {tempo1:.2f}s")
print(f"Modo rápido (cache):   {tempo2:.2f}s ({tempo1/tempo2:.1f}x)")
print(f"Modo normal:           {tempo3:.2f}s")
print(f"Modo completo:         {tempo4:.2f}s")
