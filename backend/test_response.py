import requests
import json

print("\nTestando resposta completa do endpoint /rodadas\n")

response = requests.post('http://localhost:8000/rodadas', json={
    'objetivo': 'equilibrado',
    'rodadas': 5,
    'modo': 'rapido'
})

print(f"Status: {response.status_code}")
print(f"\nResposta completa:")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
