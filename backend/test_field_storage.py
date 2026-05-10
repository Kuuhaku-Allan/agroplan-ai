"""
Teste do Storage de Talhões
"""

from core.field_storage import (
    listar_talhoes_usuario,
    criar_talhao_usuario,
    obter_talhao_usuario,
    atualizar_talhao_usuario,
    remover_talhao_usuario
)

print("=" * 60)
print("TESTE: Storage de Talhões")
print("=" * 60)

# 1. Listar (deve estar vazio inicialmente)
print("\n1. Listar talhões (inicial):")
talhoes = listar_talhoes_usuario()
print(f"   Total: {len(talhoes)}")

# 2. Criar talhão
print("\n2. Criar talhão:")
novo_talhao = criar_talhao_usuario({
    "name": "Talhão Norte",
    "area_ha": 10.5,
    "soil_type": "argiloso",
    "slope": "plano",
    "water_availability": "media",
    "uf": "SP",
    "municipio": "Clementina",
    "lat": -21.56,
    "lon": -50.45
})
print(f"   ID: {novo_talhao['id']}")
print(f"   Nome: {novo_talhao['name']}")
print(f"   Área: {novo_talhao['area_ha']} ha")

# 3. Listar novamente
print("\n3. Listar talhões (após criar):")
talhoes = listar_talhoes_usuario()
print(f"   Total: {len(talhoes)}")

# 4. Obter por ID
print("\n4. Obter talhão por ID:")
talhao = obter_talhao_usuario(novo_talhao['id'])
if talhao:
    print(f"   ✓ Encontrado: {talhao['name']}")
else:
    print(f"   ✗ Não encontrado")

# 5. Atualizar
print("\n5. Atualizar talhão:")
atualizado = atualizar_talhao_usuario(novo_talhao['id'], {
    "name": "Talhão Norte Atualizado",
    "area_ha": 12.0
})
if atualizado:
    print(f"   ✓ Atualizado: {atualizado['name']}")
    print(f"   Nova área: {atualizado['area_ha']} ha")
else:
    print(f"   ✗ Falha ao atualizar")

# 6. Criar mais um talhão
print("\n6. Criar segundo talhão:")
segundo_talhao = criar_talhao_usuario({
    "name": "Talhão Sul",
    "area_ha": 8.0,
    "soil_type": "arenoso",
    "slope": "suave",
    "water_availability": "baixa",
    "uf": "SP",
    "municipio": "Clementina"
})
print(f"   ID: {segundo_talhao['id']}")
print(f"   Nome: {segundo_talhao['name']}")

# 7. Listar todos
print("\n7. Listar todos os talhões:")
talhoes = listar_talhoes_usuario()
print(f"   Total: {len(talhoes)}")
for t in talhoes:
    print(f"   - {t['name']} ({t['area_ha']} ha)")

# 8. Remover primeiro talhão
print("\n8. Remover primeiro talhão:")
removido = remover_talhao_usuario(novo_talhao['id'])
if removido:
    print(f"   ✓ Removido com sucesso")
else:
    print(f"   ✗ Falha ao remover")

# 9. Listar final
print("\n9. Listar talhões (final):")
talhoes = listar_talhoes_usuario()
print(f"   Total: {len(talhoes)}")
for t in talhoes:
    print(f"   - {t['name']} ({t['area_ha']} ha)")

# 10. Limpar (remover talhão restante)
print("\n10. Limpar:")
remover_talhao_usuario(segundo_talhao['id'])
talhoes = listar_talhoes_usuario()
print(f"   Total final: {len(talhoes)}")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO COM SUCESSO!")
print("=" * 60)
