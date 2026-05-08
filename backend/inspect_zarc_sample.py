"""
Inspeciona amostra do CSV ZARC para entender estrutura
"""
from providers.zarc_provider import get_zarc_dataset

print("Carregando dataset ZARC...")
dataset_info = get_zarc_dataset()

if dataset_info and dataset_info.get("records"):
    records = dataset_info["records"]
    print(f"\nTotal de registros: {len(records)}")
    print(f"Source: {dataset_info['source']}")
    print(f"Fallback: {dataset_info['fallback']}")
    
    # Mostrar primeiros 3 registros
    print("\n" + "=" * 80)
    print("AMOSTRA DE REGISTROS")
    print("=" * 80)
    
    for i, record in enumerate(records[:3], 1):
        print(f"\nRegistro {i}:")
        print(f"  Cultura: {record.get('Nome_cultura', 'N/A')}")
        print(f"  UF: {record.get('UF', 'N/A')}")
        print(f"  Município: {record.get('municipio', 'N/A')}")
        print(f"  Cod_Solo: {record.get('Cod_Solo', 'N/A')}")
        print(f"  Safra: {record.get('SafraIni', 'N/A')} - {record.get('SafraFin', 'N/A')}")
        
        # Mostrar alguns decêndios
        decendios_sample = []
        for dec in range(1, 37):
            val = record.get(f"dec{dec}", "")
            if val and val.strip():
                decendios_sample.append(f"dec{dec}={val}")
        
        if decendios_sample:
            print(f"  Decêndios (amostra): {', '.join(decendios_sample[:10])}")
        else:
            print(f"  Decêndios: (todos vazios)")
    
    # Buscar um registro de SOJA em SP com decêndios
    print("\n" + "=" * 80)
    print("BUSCANDO SOJA EM SP COM DECÊNDIOS")
    print("=" * 80)
    
    count = 0
    for record in records:
        if record.get('Nome_cultura', '').upper() == 'SOJA' and record.get('UF', '') == 'SP':
            # Verificar se tem decêndios
            has_decendios = False
            for dec in range(1, 37):
                val = record.get(f"dec{dec}", "")
                if val and val.strip() and val.strip() != '0':
                    has_decendios = True
                    break
            
            if has_decendios:
                print(f"\nEncontrado:")
                print(f"  Cultura: {record.get('Nome_cultura')}")
                print(f"  UF: {record.get('UF')}")
                print(f"  Município: {record.get('municipio')}")
                print(f"  Cod_Solo: {record.get('Cod_Solo')}")
                
                # Mostrar decêndios
                decendios_vals = []
                for dec in range(1, 37):
                    val = record.get(f"dec{dec}", "")
                    if val and val.strip():
                        decendios_vals.append(f"{dec}:{val}")
                
                print(f"  Decêndios: {', '.join(decendios_vals)}")
                
                count += 1
                if count >= 2:
                    break
    
    if count == 0:
        print("\nNenhum registro de SOJA em SP com decêndios encontrado")
else:
    print("Nenhum dataset disponível")
