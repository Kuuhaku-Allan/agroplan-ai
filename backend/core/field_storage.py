"""
Storage simples para talhões do usuário

Persistência em JSON local:
- API Local: dados persistem no PC do usuário (~/.agroplan/backend/data/user_fields/)
- API Render: dados temporários/voláteis (perdem-se ao reiniciar)

Fase futura: Migrar para banco de dados PostgreSQL
"""

import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path


# Diretório de dados
DATA_DIR = Path(__file__).parent.parent / "data" / "user_fields"
FIELDS_FILE = DATA_DIR / "fields.json"


def _ensure_data_dir():
    """Garante que o diretório de dados existe"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Criar arquivo vazio se não existir
    if not FIELDS_FILE.exists():
        with open(FIELDS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)


def _load_fields() -> List[Dict]:
    """Carrega todos os talhões do arquivo JSON"""
    _ensure_data_dir()
    
    try:
        with open(FIELDS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _save_fields(fields: List[Dict]):
    """
    Salva talhões no arquivo JSON com escrita segura.
    
    Usa arquivo temporário + rename para evitar corrupção.
    """
    _ensure_data_dir()
    
    # Escrever em arquivo temporário
    temp_file = FIELDS_FILE.with_suffix('.tmp')
    
    try:
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(fields, f, indent=2, ensure_ascii=False)
        
        # Renomear atomicamente
        temp_file.replace(FIELDS_FILE)
    except Exception as e:
        # Limpar arquivo temporário em caso de erro
        if temp_file.exists():
            temp_file.unlink()
        raise e


def listar_talhoes_usuario() -> List[Dict]:
    """
    Lista todos os talhões do usuário.
    
    Returns:
        Lista de talhões
    """
    return _load_fields()


def criar_talhao_usuario(data: Dict) -> Dict:
    """
    Cria um novo talhão.
    
    Args:
        data: Dados do talhão (sem id, created_at, updated_at)
    
    Returns:
        Talhão criado com id e timestamps
    """
    fields = _load_fields()
    
    # Gerar novo talhão
    now = datetime.now().isoformat()
    new_field = {
        "id": str(uuid.uuid4()),
        **data,
        "created_at": now,
        "updated_at": now
    }
    
    fields.append(new_field)
    _save_fields(fields)
    
    return new_field


def obter_talhao_usuario(field_id: str) -> Optional[Dict]:
    """
    Obtém um talhão pelo ID.
    
    Args:
        field_id: ID do talhão
    
    Returns:
        Talhão ou None se não encontrado
    """
    fields = _load_fields()
    
    for field in fields:
        if field.get("id") == field_id:
            return field
    
    return None


def atualizar_talhao_usuario(field_id: str, data: Dict) -> Optional[Dict]:
    """
    Atualiza um talhão existente.
    
    Args:
        field_id: ID do talhão
        data: Novos dados (sem id, created_at, updated_at)
    
    Returns:
        Talhão atualizado ou None se não encontrado
    """
    fields = _load_fields()
    
    for i, field in enumerate(fields):
        if field.get("id") == field_id:
            # Preservar id e created_at, atualizar updated_at
            updated_field = {
                "id": field["id"],
                **data,
                "created_at": field["created_at"],
                "updated_at": datetime.now().isoformat()
            }
            
            fields[i] = updated_field
            _save_fields(fields)
            
            return updated_field
    
    return None


def remover_talhao_usuario(field_id: str) -> bool:
    """
    Remove um talhão.
    
    Args:
        field_id: ID do talhão
    
    Returns:
        True se removido, False se não encontrado
    """
    fields = _load_fields()
    
    original_length = len(fields)
    fields = [f for f in fields if f.get("id") != field_id]
    
    if len(fields) < original_length:
        _save_fields(fields)
        return True
    
    return False
