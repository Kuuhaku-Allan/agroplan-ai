"""
Motor de Replanejamento por Imprevistos — Fase 10.6

Recebe um imprevisto e o calendário atual, e gera sugestões de ajuste
sem aplicá-las automaticamente. Usa linguagem cautelosa e requer
validação manual para situações de risco alto.

Limitações:
- Não substitui assistência técnica agronômica.
- Não recomenda defensivos específicos.
- Não aplica mudanças automaticamente.
- Sugestões dependem de avaliação das condições reais do talhão.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import copy

from core.planning_models import (
    ReplanningEvent,
    ReplanningSuggestion,
    RiskLevel,
    EventType,
)

DISCLAIMER = (
    "Avalie as condições reais do talhão antes de executar qualquer ação. "
    "Estas são sugestões de ajuste, não ordens. "
    "Consulte assistência técnica em caso de pragas ou doenças."
)

CRITICAL_PHASES = {
    "floração", "floracão", "florescimento", "formação de grãos",
    "enchimento de grãos", "frutificação", "desenvolvimento reprodutivo",
}

CRITICAL_TASK_TYPES = {
    "plant", "harvest", "fertilize", "irrigate",
    "prepare_soil", "PLANT", "HARVEST", "FERTILIZE", "IRRIGATE",
}

WEATHER_SENSITIVE_TASK_TYPES = {
    "plant", "harvest", "prepare_soil",
    "PLANT", "HARVEST", "PREPARE_SOIL",
}


def _parse_date(date_str: str) -> Optional[datetime]:
    """Tenta parsear string de data para datetime."""
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def _format_date(dt: datetime) -> str:
    """Formata datetime para string YYYY-MM-DD."""
    return dt.strftime("%Y-%m-%d")


def _add_days(date_str: str, days: int) -> str:
    """Adiciona N dias a uma data string."""
    dt = _parse_date(date_str)
    if dt:
        return _format_date(dt + timedelta(days=days))
    return date_str


def _is_critical_task(task: Dict[str, Any]) -> bool:
    """Verifica se a tarefa é crítica por tipo ou prioridade."""
    priority = (task.get("priority") or "").lower()
    task_type = task.get("type") or task.get("task_type") or ""
    phase = (task.get("phase") or "").lower()

    if priority in ("critical", "high"):
        return True
    if task_type in CRITICAL_TASK_TYPES:
        return True
    for cp in CRITICAL_PHASES:
        if cp in phase:
            return True
    return False


def _is_critical_phase(task: Dict[str, Any]) -> bool:
    """Verifica se a tarefa está em fase hídrica crítica."""
    phase = (task.get("phase") or "").lower()
    description = (task.get("description") or "").lower()
    return any(cp in phase or cp in description for cp in CRITICAL_PHASES)


def _find_tasks_near_date(
    tasks: List[Dict[str, Any]],
    event_date: str,
    window_days: int = 7,
    task_type_filter: Optional[set] = None,
) -> List[Dict[str, Any]]:
    """Retorna tarefas próximas à data do evento."""
    event_dt = _parse_date(event_date)
    if not event_dt:
        return []

    result = []
    for task in tasks:
        task_dt = _parse_date(task.get("date", ""))
        if not task_dt:
            continue
        diff = abs((task_dt - event_dt).days)
        if diff <= window_days:
            if task_type_filter:
                if (task.get("type") or "").lower() in {t.lower() for t in task_type_filter}:
                    result.append(task)
            else:
                result.append(task)
    return result


def _has_rain_in_weather_context(tasks: List[Dict[str, Any]], date_str: str) -> bool:
    """Verifica se há chuva prevista próxima no weather_context das tarefas."""
    event_dt = _parse_date(date_str)
    if not event_dt:
        return False
    for task in tasks:
        task_dt = _parse_date(task.get("date", ""))
        if not task_dt:
            continue
        if abs((task_dt - event_dt).days) <= 5:
            wc = task.get("weather_context", {})
            if wc and wc.get("active"):
                precip = wc.get("precipitation_mm", 0) or 0
                prob = wc.get("precipitation_probability", 0) or 0
                if precip > 10 or prob > 60:
                    return True
    return False


# =====================================================================
# Handlers por tipo de evento
# =====================================================================

def _handle_missed_irrigation(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    irrigation_tasks = _find_tasks_near_date(
        tasks, event.date, window_days=10, task_type_filter={"irrigate"}
    )

    has_rain = _has_rain_in_weather_context(tasks, event.date)

    if irrigation_tasks:
        next_task = sorted(
            irrigation_tasks,
            key=lambda t: _parse_date(t.get("date", "")) or datetime.min,
        )[0]
        is_critical = _is_critical_task(next_task)
        risk = RiskLevel.ALTO if is_critical else RiskLevel.MEDIO
        suggested = _add_days(event.date, 1)

        suggestions.append(
            ReplanningSuggestion(
                action="Sugestão de ajuste: reagendar irrigação perdida para o próximo dia viável.",
                original_date=event.date,
                suggested_date=suggested,
                reason=(
                    "A irrigação não foi realizada na data prevista. "
                    "Reagendar para o próximo dia pode minimizar o impacto no desenvolvimento da cultura."
                ),
                risk_level=risk,
                requires_manual_validation=is_critical,
                affected_task_id=next_task.get("id"),
            )
        )

        if has_rain:
            suggestions.append(
                ReplanningSuggestion(
                    action="Sugestão de ajuste: verificar umidade do solo antes de irrigar.",
                    original_date=event.date,
                    suggested_date=suggested,
                    reason=(
                        "Há previsão de chuva próxima segundo dados climáticos disponíveis. "
                        "Avalie as condições reais do solo antes de realizar irrigação complementar."
                    ),
                    risk_level=RiskLevel.BAIXO,
                    requires_manual_validation=False,
                    affected_task_id=next_task.get("id"),
                )
            )
    else:
        suggestions.append(
            ReplanningSuggestion(
                action="Sugestão de ajuste: monitorar umidade do solo e realizar irrigação se necessário.",
                original_date=event.date,
                suggested_date=_add_days(event.date, 1),
                reason="Não foram encontradas tarefas de irrigação próximas. Avalie o estado hídrico da cultura.",
                risk_level=RiskLevel.MEDIO,
                requires_manual_validation=False,
                affected_task_id=event.affected_task_id,
            )
        )

    return suggestions


def _handle_heavy_rain(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    sensitive_types = {"plant", "harvest", "prepare_soil", "fertilize"}
    sensitive_tasks = _find_tasks_near_date(
        tasks, event.date, window_days=5, task_type_filter=sensitive_types
    )

    if sensitive_tasks:
        for task in sensitive_tasks[:3]:  # Limita a 3 sugestões
            is_critical = _is_critical_task(task)
            risk = RiskLevel.ALTO if is_critical else RiskLevel.MEDIO
            suggestions.append(
                ReplanningSuggestion(
                    action=f"Sugestão de ajuste: considerar adiar a operação '{task.get('title', 'tarefa')}' por 1 a 3 dias.",
                    original_date=task.get("date"),
                    suggested_date=_add_days(task.get("date", event.date), 2),
                    reason=(
                        "Chuva intensa pode tornar o solo encharcado, dificultando plantio, "
                        "colheita e operações mecanizadas. "
                        "Avalie as condições reais do talhão antes de prosseguir."
                    ),
                    risk_level=risk,
                    requires_manual_validation=is_critical,
                    affected_task_id=task.get("id"),
                )
            )
    else:
        nearby = _find_tasks_near_date(tasks, event.date, window_days=7)
        weather_sensitive = [t for t in nearby if t.get("weather_sensitive")]
        if weather_sensitive:
            for task in weather_sensitive[:2]:
                suggestions.append(
                    ReplanningSuggestion(
                        action=f"Sugestão de ajuste: monitorar impacto da chuva na tarefa '{task.get('title', 'tarefa')}'.",
                        original_date=task.get("date"),
                        suggested_date=None,
                        reason=(
                            "Esta tarefa é sensível ao clima. "
                            "Chuva intensa pode afetar a execução. "
                            "Avalie as condições do talhão antes de prosseguir."
                        ),
                        risk_level=RiskLevel.MEDIO,
                        requires_manual_validation=False,
                        affected_task_id=task.get("id"),
                    )
                )
        else:
            suggestions.append(
                ReplanningSuggestion(
                    action="Sugestão de ajuste: revisar tarefas dos próximos dias e avaliar impacto da chuva.",
                    original_date=event.date,
                    suggested_date=None,
                    reason="Chuva intensa registrada. Nenhuma tarefa crítica imediata identificada, mas monitore o solo.",
                    risk_level=RiskLevel.BAIXO,
                    requires_manual_validation=False,
                    affected_task_id=None,
                )
            )

    return suggestions


def _handle_no_rain(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    irrigation_tasks = _find_tasks_near_date(
        tasks, event.date, window_days=10, task_type_filter={"irrigate"}
    )

    if irrigation_tasks:
        for task in irrigation_tasks[:2]:
            is_critical = _is_critical_phase(task)
            risk = RiskLevel.ALTO if is_critical else RiskLevel.MEDIO
            suggestions.append(
                ReplanningSuggestion(
                    action=f"Sugestão de ajuste: manter ou antecipar irrigação prevista — '{task.get('title', 'tarefa')}'.",
                    original_date=task.get("date"),
                    suggested_date=event.date if not is_critical else _add_days(event.date, 1),
                    reason=(
                        "Ausência de chuva identificada. "
                        "Período de seca pode afetar o desenvolvimento da cultura, "
                        "especialmente em fases críticas hídrica."
                    ),
                    risk_level=risk,
                    requires_manual_validation=is_critical,
                    affected_task_id=task.get("id"),
                )
            )
    else:
        suggestions.append(
            ReplanningSuggestion(
                action="Sugestão de ajuste: avaliar necessidade de irrigação de emergência.",
                original_date=event.date,
                suggested_date=_add_days(event.date, 1),
                reason=(
                    "Nenhuma tarefa de irrigação encontrada próxima. "
                    "Ausência prolongada de chuva pode comprometer a cultura. "
                    "Avalie a capacidade de água disponível no solo."
                ),
                risk_level=RiskLevel.MEDIO,
                requires_manual_validation=False,
                affected_task_id=event.affected_task_id,
            )
        )

    return suggestions


def _handle_missed_fertilization(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []

    fertilize_tasks = _find_tasks_near_date(
        tasks, event.date, window_days=15, task_type_filter={"fertilize"}
    )

    affected = fertilize_tasks[0] if fertilize_tasks else None
    is_critical = _is_critical_task(affected) if affected else False

    suggestions.append(
        ReplanningSuggestion(
            action="Sugestão de ajuste: reagendar adubação para a próxima janela disponível (recomenda-se em até 3 dias).",
            original_date=event.date,
            suggested_date=_add_days(event.date, 2),
            reason=(
                "A adubação não realizada pode impactar o desenvolvimento nutricional da cultura. "
                "Quanto mais próximo ao prazo original, menor o impacto. "
                "Avalie condições do solo e clima antes de executar."
            ),
            risk_level=RiskLevel.ALTO if is_critical else RiskLevel.MEDIO,
            requires_manual_validation=is_critical,
            affected_task_id=affected.get("id") if affected else event.affected_task_id,
        )
    )

    return suggestions


def _handle_unavailable_day(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    day_tasks = [t for t in tasks if t.get("date") == event.date]

    if day_tasks:
        for task in day_tasks:
            is_critical = _is_critical_task(task)
            suggestions.append(
                ReplanningSuggestion(
                    action=f"Sugestão de ajuste: mover '{task.get('title', 'tarefa')}' para o próximo dia possível.",
                    original_date=event.date,
                    suggested_date=_add_days(event.date, 1),
                    reason=(
                        "Dia indisponível para operações no campo. "
                        "Reagendar para o próximo dia viável reduz o impacto."
                    ),
                    risk_level=RiskLevel.ALTO if is_critical else RiskLevel.BAIXO,
                    requires_manual_validation=is_critical,
                    affected_task_id=task.get("id"),
                )
            )
    else:
        suggestions.append(
            ReplanningSuggestion(
                action="Sugestão de ajuste: verificar se há tarefas críticas próximas que possam ser afetadas.",
                original_date=event.date,
                suggested_date=None,
                reason="Nenhuma tarefa encontrada exatamente nesta data. Avalie os dias seguintes.",
                risk_level=RiskLevel.BAIXO,
                requires_manual_validation=False,
                affected_task_id=event.affected_task_id,
            )
        )

    return suggestions


def _handle_soil_too_wet(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    risk_types = {"plant", "prepare_soil", "harvest"}
    risk_tasks = _find_tasks_near_date(
        tasks, event.date, window_days=7, task_type_filter=risk_types
    )

    if risk_tasks:
        for task in risk_tasks[:3]:
            suggestions.append(
                ReplanningSuggestion(
                    action=f"Sugestão de ajuste: adiar '{task.get('title', 'tarefa')}' até drenagem do solo.",
                    original_date=task.get("date"),
                    suggested_date=_add_days(task.get("date", event.date), 3),
                    reason=(
                        "Solo excessivamente úmido compromete plantio, preparo e operações mecanizadas. "
                        "Aguarde a drenagem natural e reavalie as condições antes de prosseguir. "
                        "Risco alto para maquinário pesado."
                    ),
                    risk_level=RiskLevel.ALTO,
                    requires_manual_validation=True,
                    affected_task_id=task.get("id"),
                )
            )
    else:
        suggestions.append(
            ReplanningSuggestion(
                action="Sugestão de ajuste: aguardar drenagem do solo antes de realizar operações.",
                original_date=event.date,
                suggested_date=_add_days(event.date, 3),
                reason=(
                    "Solo muito úmido pode causar compactação e danos à estrutura do solo. "
                    "Avalie condições antes de qualquer operação."
                ),
                risk_level=RiskLevel.MEDIO,
                requires_manual_validation=False,
                affected_task_id=event.affected_task_id,
            )
        )

    return suggestions


def _handle_soil_too_dry(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    suggestions: List[ReplanningSuggestion] = []
    nearby = _find_tasks_near_date(tasks, event.date, window_days=10)
    is_critical_nearby = any(_is_critical_phase(t) for t in nearby)

    suggestions.append(
        ReplanningSuggestion(
            action="Sugestão de ajuste: verificar necessidade de irrigação complementar.",
            original_date=event.date,
            suggested_date=_add_days(event.date, 1),
            reason=(
                "Solo muito seco pode comprometer a absorção de nutrientes e o desenvolvimento radicular. "
                "Avalie a capacidade de irrigação disponível e a fase atual da cultura."
            ),
            risk_level=RiskLevel.ALTO if is_critical_nearby else RiskLevel.MEDIO,
            requires_manual_validation=is_critical_nearby,
            affected_task_id=event.affected_task_id,
        )
    )

    return suggestions


def _handle_pest_observation(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    nearby = _find_tasks_near_date(tasks, event.date, window_days=14)
    is_critical = any(_is_critical_phase(t) for t in nearby)

    return [
        ReplanningSuggestion(
            action="Sugestão de ajuste: realizar inspeção técnica do talhão para identificação e quantificação da praga.",
            original_date=event.date,
            suggested_date=None,
            reason=(
                "A observação de pragas requer avaliação técnica especializada antes de qualquer intervenção. "
                "Não é possível recomendar produto ou dose sem diagnóstico presencial. "
                "Consulte um engenheiro agrônomo ou técnico habilitado."
            ),
            risk_level=RiskLevel.ALTO if is_critical else RiskLevel.MEDIO,
            requires_manual_validation=True,
            affected_task_id=event.affected_task_id,
        )
    ]


def _handle_disease_observation(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    return [
        ReplanningSuggestion(
            action="Sugestão de ajuste: solicitar diagnóstico técnico para identificação da doença.",
            original_date=event.date,
            suggested_date=None,
            reason=(
                "Doenças em culturas requerem diagnóstico preciso antes de qualquer medida de controle. "
                "A aplicação incorreta de produtos pode agravar o problema ou gerar resistência. "
                "Consulte assistência técnica agronômica habilitada o mais breve possível."
            ),
            risk_level=RiskLevel.ALTO,
            requires_manual_validation=True,
            affected_task_id=event.affected_task_id,
        )
    ]


def _handle_other(
    tasks: List[Dict[str, Any]], event: ReplanningEvent
) -> List[ReplanningSuggestion]:
    nearby_critical = [
        t for t in _find_tasks_near_date(tasks, event.date, window_days=10)
        if _is_critical_task(t)
    ]

    suggestions = [
        ReplanningSuggestion(
            action="Sugestão de ajuste: revisar o calendário e avaliar tarefas críticas próximas.",
            original_date=event.date,
            suggested_date=None,
            reason=(
                "Um imprevisto foi registrado. "
                "Revise as tarefas dos próximos dias e avalie se alguma operação crítica pode ser afetada. "
                "Valide manualmente as condições do talhão."
            ),
            risk_level=RiskLevel.MEDIO,
            requires_manual_validation=True,
            affected_task_id=event.affected_task_id,
        )
    ]

    if nearby_critical:
        for task in nearby_critical[:2]:
            suggestions.append(
                ReplanningSuggestion(
                    action=f"Sugestão de ajuste: validar manualmente a tarefa crítica '{task.get('title', 'tarefa')}'.",
                    original_date=task.get("date"),
                    suggested_date=None,
                    reason="Tarefa crítica identificada próxima ao imprevisto. Avalie se há necessidade de ajuste.",
                    risk_level=RiskLevel.ALTO,
                    requires_manual_validation=True,
                    affected_task_id=task.get("id"),
                )
            )

    return suggestions


# =====================================================================
# Função principal
# =====================================================================

HANDLERS = {
    EventType.MISSED_IRRIGATION: _handle_missed_irrigation,
    EventType.HEAVY_RAIN: _handle_heavy_rain,
    EventType.NO_RAIN: _handle_no_rain,
    EventType.MISSED_FERTILIZATION: _handle_missed_fertilization,
    EventType.UNAVAILABLE_DAY: _handle_unavailable_day,
    EventType.SOIL_TOO_WET: _handle_soil_too_wet,
    EventType.SOIL_TOO_DRY: _handle_soil_too_dry,
    EventType.PEST_OBSERVATION: _handle_pest_observation,
    EventType.DISEASE_OBSERVATION: _handle_disease_observation,
    EventType.OTHER: _handle_other,
}

EVENT_LABELS = {
    EventType.MISSED_IRRIGATION: "Irrigação não realizada",
    EventType.HEAVY_RAIN: "Chuva excessiva",
    EventType.NO_RAIN: "Ausência de chuva",
    EventType.MISSED_FERTILIZATION: "Adubação não realizada",
    EventType.UNAVAILABLE_DAY: "Dia indisponível",
    EventType.SOIL_TOO_WET: "Solo muito úmido",
    EventType.SOIL_TOO_DRY: "Solo muito seco",
    EventType.PEST_OBSERVATION: "Observação de praga",
    EventType.DISEASE_OBSERVATION: "Observação de doença",
    EventType.OTHER: "Outro imprevisto",
}


def replanejar_calendario(
    calendar: dict,
    event: ReplanningEvent,
) -> dict:
    """
    Motor principal de replanejamento.
    
    Recebe o calendário atual e um imprevisto registrado pelo usuário,
    e retorna sugestões de ajuste sem aplicá-las automaticamente.
    
    Args:
        calendar: Dicionário com o calendário agrícola atual (campo 'tasks').
        event: Imprevisto registrado pelo usuário.
    
    Returns:
        Dicionário com suggestions, updated_tasks, warnings e summary.
    """
    tasks: List[Dict[str, Any]] = calendar.get("tasks", [])
    warnings: List[str] = [DISCLAIMER]

    # Adicionar avisos específicos por tipo de evento
    if event.event_type in (EventType.PEST_OBSERVATION, EventType.DISEASE_OBSERVATION):
        warnings.append(
            "⚠️ Requer validação manual. Consulte assistência técnica agronômica habilitada."
        )

    # Executar handler correspondente
    handler = HANDLERS.get(event.event_type, _handle_other)
    suggestions: List[ReplanningSuggestion] = handler(tasks, event)

    # Injetar IDs nas sugestões
    for i, s in enumerate(suggestions):
        s.id = f"suggestion-{i+1}"

    # Montar updated_tasks: tarefas afetadas pelas sugestões (sem alterar o original)
    affected_ids = {s.affected_task_id for s in suggestions if s.affected_task_id}
    updated_tasks = [t for t in tasks if t.get("id") in affected_ids]

    # Resumo
    n = len(suggestions)
    event_label = EVENT_LABELS.get(event.event_type, "Imprevisto")
    high_risk = sum(1 for s in suggestions if s.risk_level == RiskLevel.ALTO)
    manual_val = sum(1 for s in suggestions if s.requires_manual_validation)

    summary_parts = [f"Foram geradas {n} sugestão(ões) de ajuste para o imprevisto: {event_label}."]
    if high_risk:
        summary_parts.append(f"{high_risk} sugestão(ões) com risco alto.")
    if manual_val:
        summary_parts.append(f"{manual_val} sugestão(ões) exigem validação manual.")
    summary_parts.append("Nenhuma sugestão é aplicada automaticamente.")
    summary = " ".join(summary_parts)

    return {
        "event": event.model_dump(mode="json"),
        "suggestions": [s.model_dump(mode="json") for s in suggestions],
        "updated_tasks": updated_tasks,
        "warnings": warnings,
        "summary": summary,
    }


def aplicar_sugestao_replanejamento(
    calendar: dict,
    suggestion: ReplanningSuggestion,
    event: Optional[ReplanningEvent] = None
) -> dict:
    """
    Aplica uma sugestão de replanejamento em um calendário,
    retornando a versão ajustada e o original.
    """
    original_calendar = calendar
    updated_calendar = copy.deepcopy(calendar)
    change_log = []
    warnings = []

    if suggestion.requires_manual_validation:
        warnings.append("Esta sugestão exige validação manual antes de ser seguida em campo.")

    tasks = updated_calendar.get("tasks", [])
    target_task = None

    if suggestion.affected_task_id:
        target_task = next((t for t in tasks if t.get("id") == suggestion.affected_task_id), None)
    
    if not target_task and suggestion.original_date:
        # Tenta por data original
        target_task = next((t for t in tasks if t.get("date") == suggestion.original_date), None)

    if not target_task:
        warnings.append("Não foi possível encontrar a tarefa original para aplicar o ajuste.")
    else:
        # Atualiza a tarefa
        old_date = target_task.get("date")
        if suggestion.suggested_date:
            target_task["date"] = suggestion.suggested_date
        
        target_task["replanned"] = True
        target_task["original_date"] = old_date
        target_task["replanning_reason"] = suggestion.reason
        target_task["replanning_event_type"] = event.event_type if event else "unknown"
        target_task["replanning_applied_at"] = datetime.now().isoformat()
        
        change_log.append({
            "task_id": target_task.get("id"),
            "old_date": old_date,
            "new_date": target_task.get("date"),
            "action": suggestion.action
        })

    return {
        "summary": "Sugestão aplicada em modo de simulação.",
        "original_calendar": original_calendar,
        "updated_calendar": updated_calendar,
        "applied_suggestion": suggestion.model_dump(mode="json"),
        "change_log": change_log,
        "warnings": warnings,
    }
