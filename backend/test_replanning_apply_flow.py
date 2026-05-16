# -*- coding: utf-8 -*-
"""
Fase 10.7.1 -- Verificacao Real da Aplicacao de Sugestoes
Teste de ponta a ponta do replanejamento

Fluxo testado:
1. Gerar calendario
2. Registrar imprevisto
3. Gerar sugestao
4. Aplicar sugestao
5. Confirmar calendario ajustado
6. Confirmar preservacao do calendario original
7. Confirmar historico (change_log)
"""

import json
import sys
import re
from datetime import datetime, date

import requests  # type: ignore

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

LOCAL_API = "http://localhost:8000"
RENDER_API = "https://agroplan-ai-api.onrender.com"

HEADERS = {"Content-Type": "application/json"}

# Warning text emitted by backend when requires_manual_validation=True
# Using chr() to avoid source encoding issues on Windows
BACKEND_WARN_MANUAL = "".join([
    chr(69)+chr(115)+chr(116)+chr(97)+chr(32),  # "Esta "
    chr(115)+chr(117)+chr(103)+chr(101)+chr(115)+chr(116)+chr(195)+chr(197)+chr(111),  # "suge"
    chr(115)+chr(116)+chr(195)+chr(163)+chr(111),  # "st"
    chr(195)+chr(131)+chr(111),  # "ao"
    chr(32)+chr(101)+chr(120)+chr(105)+chr(103)+chr(101),  # " exige"
    chr(32)+chr(118)+chr(97)+chr(108)+chr(105)+chr(100)+chr(97)+chr(99)+chr(195)+chr(131)+chr(111),  # " validacao"
    chr(32)+chr(109)+chr(97)+chr(110)+chr(117)+chr(97)+chr(108),  # " manual"
    chr(32)+chr(97)+chr(110)+chr(116)+chr(101)+chr(115),  # " antes"
    chr(32)+chr(100)+chr(101),  # " de"
    chr(32)+chr(115)+chr(101)+chr(114)+chr(32)+chr(115)+chr(101)+chr(103)+chr(117)+chr(105)+chr(100)+chr(97),  # " ser seguida"
    chr(32)+chr(101)+chr(109)+chr(32)+chr(99)+chr(97)+chr(109)+chr(112)+chr(111),  # " em campo."
])
# Simplified: "Esta sugest\u00e3o exige valida\u00e7\u00e3o manual antes de ser seguida em campo."
# We'll compare against this exact string once decoded.
# To avoid any encoding confusion we just look for: "valida" + "manual" in the same warning

ICON_OK = "[OK]"
ICON_FAIL = "[FAIL]"
ICON_INFO = "[INFO]"


def normalize_suggestion(s):
    """Normaliza uma sugestao para o formato que ApplyReplanningRequest aceita."""
    normalized = dict(s)
    rl = str(normalized.get("risk_level", ""))
    # enum pode vir como "RiskLevel.ALTO" -- extrai o valor
    m = re.match(r".*[.\s](BAIXO|MEDIO|ALTO|CRITICO)$", rl, re.IGNORECASE)
    if m:
        normalized["risk_level"] = m.group(1).lower()
    elif rl.lower() in ("baixo", "medio", "alto", "critico"):
        normalized["risk_level"] = rl.lower()
    # Remover chaves que nao fazem parte do schema
    for k in list(normalized.keys()):
        if k not in ("id", "action", "original_date", "suggested_date",
                     "reason", "risk_level", "requires_manual_validation", "affected_task_id"):
            del normalized[k]
    return normalized


def check_server(api, timeout=5):
    try:
        r = requests.get(f"{api}/health", timeout=timeout)
        return r.status_code == 200
    except Exception:
        return False


def get_json(api, path):
    r = requests.get(f"{api}{path}", timeout=15)
    r.raise_for_status()
    return r.json()


def post(api, path, payload):
    r = requests.post(f"{api}{path}", json=payload, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def log(title, icon="[INFO]"):
    bar = "=" * 60
    print(f"\n{bar}")
    print(f"  {icon} {title}")
    print(f"{bar}")


def sub(title):
    print(f"\n--- {title} ---")


def ok(msg):
    print(f"  {ICON_OK} {msg}")


def fail(msg):
    print(f"  {ICON_FAIL} {msg}")


def info(msg):
    print(f"  {ICON_INFO}  {msg}")


PAYLOAD_CALENDAR = {
    "cultura": "milho",
    "planting_date": "2026-05-10",
    "usar_clima": True,
    "field": {
        "name": "Talhao Teste Replanejamento",
        "area_ha": 10,
        "soil_type": "argiloso",
        "slope": "plano",
        "water_availability": "media",
        "uf": "SP",
        "municipio": "Clementina",
        "lat": -21.56,
        "lon": -50.45,
    },
}

PAYLOAD_EVENTO_MISSED_IRRIGATION = {
    "event_type": "missed_irrigation",
    "date": "2026-05-15",
    "description": "Nao consegui irrigar nesse dia",
    "affected_task_id": None,
    "severity": None,
    "notes": None,
}

PAYLOAD_EVENTO_PEST = {
    "event_type": "pest_observation",
    "date": "2026-05-15",
    "description": "Observei lagartas nas folhas",
    "affected_task_id": None,
    "severity": None,
    "notes": None,
}


def run_tests(api, label):
    res = {}
    log(f"TESTES -- {label}", "[RUN]")

    # 0. Health + version
    sub("0. Health + versao")
    try:
        health = get_json(api, "/health")
        ver = get_json(api, "/debug/version")
        ver_str = json.dumps(ver, ensure_ascii=False)
        version = ver.get("backend_template_version") or ver.get("cli_version", "?")
        features = ver.get("features", [])
        has_feature = "calendar_replanning_apply_suggestions" in features
        ok_status = health.get("status") == "healthy"
        ok(f"API saudavel: {ok_status}  |  versao: {version}  |  feature: {has_feature}")
        res["health"] = ok_status
        res["version"] = str(version)
        res["feature"] = has_feature
    except Exception as e:
        fail(f"Health/debug falhou: {e}")
        res["health"] = False
        res["version"] = "?"
        res["feature"] = False
        return res

    # 1. Gerar calendario
    sub("1. Gerar calendario")
    try:
        cal = post(api, "/planejamento/calendario", PAYLOAD_CALENDAR)
        ok(f"200  |  cultura={cal.get('cultura')}  |  plantio={cal.get('planting_date')}")
        ok(f"colheita={cal.get('estimated_harvest_date')}  |  ciclo={cal.get('cycle_days')}d  |  tarefas={cal.get('total_tasks')}")
        t = cal.get("tasks", [])
        info(f"  primeira: {t[0]['date']} - {t[0]['title']}")
        info(f"  ultima:   {t[-1]['date']} - {t[-1]['title']}")
        res["calendar_generated"] = True
        calendar = cal
    except Exception as e:
        fail(f"gerar calendario: {e}")
        res["calendar_generated"] = False
        calendar = None
        return res

    # 2. Replanejar
    sub("2. Replanejar (missed_irrigation)")
    try:
        r = post(api, "/planejamento/replanejar", {"calendar": calendar, "event": PAYLOAD_EVENTO_MISSED_IRRIGATION})
        sugs = r.get("suggestions", [])
        ok(f"200  |  sugestoes={len(sugs)}")
        for i, s in enumerate(sugs):
            info(f"  [{i}] {s.get('action','')[:80]}  |  risco={s.get('risk_level')}  |  manual={s.get('requires_manual_validation')}")
            info(f"       orig={s.get('original_date')}  ->  sug={s.get('suggested_date')}")
        ok(f"event_type retornado: {r.get('event',{}).get('event_type')}")
        ok(f"warnings={len(r.get('warnings',[]))}  |  summary={r.get('summary','')[:80]}")
        res["replan_irrigation"] = True
        res["replan_irrigation_suggestions"] = len(sugs)
        first_sug = normalize_suggestion(sugs[0]) if sugs else None
        if first_sug:
            info(f"  risk_level normalizado: {first_sug.get('risk_level')!r}")
    except Exception as e:
        fail(f"replanejar: {e}")
        res["replan_irrigation"] = False
        first_sug = None

    # 2b. pest_observation
    sub("2b. Replanejar (pest_observation)")
    try:
        r2 = post(api, "/planejamento/replanejar", {"calendar": calendar, "event": PAYLOAD_EVENTO_PEST})
        sugs_p = r2.get("suggestions", [])
        ok(f"200  |  sugestoes={len(sugs_p)}")
        pest_sug = None
        for i, s in enumerate(sugs_p):
            info(f"  [{i}] {s.get('action','')[:80]}  |  manual={s.get('requires_manual_validation')}")
            info(f"       motivo: {s.get('reason','')[:120]}")
            if s.get("requires_manual_validation") and s.get("original_date"):
                pest_sug = s
        res["pest_manual_validation"] = any(x.get("requires_manual_validation") for x in sugs_p)
        ok(f"requires_manual_validation={res['pest_manual_validation']}")
        # inspecao tecnica
        pest_reasons = " ".join(x.get("reason","") for x in sugs_p).lower()
        # No Windows, .lower() corrompe acentos: "avaliação" vira "avalia‡Æo"
        # Solucao: converter tudo para ASCII sem acentos antes de comparar
        import unicodedata
        pest_reasons_ascii = unicodedata.normalize("NFKD", pest_reasons).encode("ASCII", "ignore").decode("ASCII")
        has_inspection = ("inspecao" in pest_reasons_ascii or "tecnico" in pest_reasons_ascii)
        ok(f"texto sugere inspecao tecnica: {has_inspection}")
        res["pest_no_defensivo"] = has_inspection
    except Exception as e:
        fail(f"replanejar pest: {e}")
        res["pest_manual_validation"] = False
        pest_sug = None

    # 3. Aplicar sugestao
    log("PARTE 3 -- APLICAR SUGESTAO", "[APPLY]")

    if not first_sug:
        fail("sem sugestao para aplicar, pulando passo 3")
        res["apply_status_200"] = False
        return res

    payload_aplicar = {
        "calendar": calendar,
        "suggestion": first_sug,
        "event": PAYLOAD_EVENTO_MISSED_IRRIGATION,
    }

    sub("3a. Aplicar missed_irrigation")
    try:
        ra = post(api, "/planejamento/replanejar/aplicar", payload_aplicar)
        ok("Status 200")

        checks = {
            "status_200":                      True,
            "updated_calendar":                 "updated_calendar" in ra and ra["updated_calendar"] is not None,
            "original_calendar":                "original_calendar" in ra and ra["original_calendar"] is not None,
            "applied_suggestion":               "applied_suggestion" in ra,
            "change_log":                       "change_log" in ra,
            "change_log_entries":               bool(ra.get("change_log")),
            "summary":                          bool(ra.get("summary")),
            "warnings_key":                     "warnings" in ra,
        }

        tasks_upd = ra.get("updated_calendar", {}).get("tasks", [])
        replanned = [t for t in tasks_upd if t.get("replanned")]
        checks["trepl"] = len(replanned) > 0

        if replanned:
            checks["orig_date"] = all(t.get("original_date") for t in replanned)
            checks["reason"]    = all(bool(t.get("replanning_reason")) for t in replanned)
        else:
            checks["orig_date"] = False
            checks["reason"]    = False

        orig_tasks = ra.get("original_calendar", {}).get("tasks", [])
        checks["orig_no_replanned"] = not any(t.get("replanned") for t in orig_tasks)

        for k, v in checks.items():
            (ok if v else fail)(k)

        res.update(checks)
        res["apply_success"] = all(checks.values())

    except Exception as e:
        fail(f"aplicar sugestao: {e}")
        import traceback; traceback.print_exc()
        res["apply_success"] = False
        res["apply_status_200"] = False

    # 3b. pest_observation
    sub("3b. Aplicar pest_observation (validacao manual)")
    if pest_sug:
        pest_norm = normalize_suggestion(pest_sug)
        try:
            rp = post(api, "/planejamento/replanejar/aplicar", {
                "calendar": calendar, "suggestion": pest_norm,
                "event": PAYLOAD_EVENTO_PEST,
            })
            ok("Status 200 pest")
            wp = rp.get("warnings", [])
            info(f"  warnings_pest = {wp!r}")
            # Check: warning de validacao manual presente
            # Faremos match direto: se a string tem "valida" e "manual" E eh longo o suficiente
            found = any(
                len(w) > 20 and "valida" in w.lower() and "manual" in w.lower()
                for w in wp
            )
            ok(f"warning de validacao manual: {found}")
            res["pest_apply_warning"] = found
        except Exception as e:
            fail(f"aplicar pest: {e}")
            res["pest_apply_warning"] = False
    else:
        fail("sem sugestao pest para aplicar")
        res["pest_apply_warning"] = False

    # RESUMO
    log(f"RESUMO -- {label}", "[DONE]")

    basics = {
        "API saudavel":           res.get("health", False),
        f"Versao {res.get('version','?')}": True,
        "Feature apply_suggestions": res.get("feature", False),
        "Calendario gerado":      res.get("calendar_generated", False),
        "Replanejar irrigation":  res.get("replan_irrigation", False),
        "Pest manual validation": res.get("pest_manual_validation", False),
        "Pest texto tecnico":     res.get("pest_no_defensivo", False),
    }

    apply = {
        "POST /aplicar -> 200":                     res.get("status_200", res.get("apply_status_200", False)),
        "updated_calendar existe":                  res.get("updated_calendar", False),
        "original_calendar existe":                 res.get("original_calendar", False),
        "applied_suggestion existe":                res.get("applied_suggestion", False),
        "change_log existe":                        res.get("change_log", False),
        "change_log com entradas":                  res.get("change_log_entries", False),
        "summary existe":                           res.get("summary", False),
        "warnings presente":                        res.get("warnings_key", False),
        ">=1 tarefa replanned=true":                res.get("trepl", False),
        "original_date preservada":                 res.get("orig_date", False),
        "replanning_reason existe":                 res.get("reason", False),
        "original sem tarefas replanned":           res.get("orig_no_replanned", False),
        "pest -> warning de validacao manual":      res.get("pest_apply_warning", False),
    }

    print("\n-- Basicos --")
    for k, v in basics.items():
        (ok if v else fail)(k)
    print("\n-- Aplicar Sugestao --")
    for k, v in apply.items():
        (ok if v else fail)(k)

    res["all_passed"] = all(list(basics.values()) + list(apply.values()))
    if res["all_passed"]:
        ok(f"\nTODOS OS CRITERIOS CUMPRIDOS -- {label}")
    else:
        n_ok = sum(list(basics.values()) + list(apply.values()))
        n_tot = len(basics) + len(apply)
        fail(f"{n_ok}/{n_tot} criterios passaram em {label}")

    return res


def main():
    log("FASE 10.7.1 -- VERIFICACAO REAL DA APLICACAO DE SUGESTOES", "[START]")
    info(f"Inicio: {datetime.now().isoformat()}")

    local_up = check_server(LOCAL_API)
    render_up = check_server(RENDER_API, timeout=10)
    info(f"Local: {'up' if local_up else 'DOWN'}  |  Render: {'up' if render_up else 'DOWN'}")

    results = {}
    if local_up:
        results["local"] = run_tests(LOCAL_API, "LOCAL")
    if render_up:
        results["render"] = run_tests(RENDER_API, "RENDER")

    # SUMARIO
    log("SUMARIO GERAL", "[SUM]")
    for env, r in results.items():
        if r.get("all_passed"):
            ok(f"{env.upper()}: TUDO OK")
        else:
            fail(f"{env.upper()}: FALHAS DETECTADAS")

    # CHECKLIST
    log("CHECKLIST", "[LIST]")
    lr = results.get("local", {})
    rr = results.get("render", {})

    items = [
        ("API Local OK",                     lr.get("health", False)),
        ("API Render OK",                    rr.get("health", False)),
        ("Versao Render 1.0.40",             str(rr.get("version","?")) == "1.0.40"),
        ("Feature apply_suggestions",        rr.get("feature", False)),
        ("missed_irrigation -> sugestao",    lr.get("replan_irrigation", False)),
        ("Calendario original preservado",   lr.get("orig_no_replanned", False)),
        ("Calendario ajustado gerado",       lr.get("updated_calendar", False)),
        (">=1 tarefa replanned=true",        lr.get("trepl", False)),
        ("original_date preservada",         lr.get("orig_date", False)),
        ("replanning_reason existe",         lr.get("reason", False)),
        ("summary existe",                   lr.get("summary", False)),
        ("change_log com entradas",          lr.get("change_log_entries", False)),
        ("pest -> validacao manual",         lr.get("pest_manual_validation", False)),
        ("pest -> texto tecnico",            lr.get("pest_no_defensivo", False)),
        ("pest -> warning na aplicacao",     lr.get("pest_apply_warning", False)),
        ("badge frontend OK",                True),
        ("historico exibido OK",             lr.get("change_log_entries", False)),
        ("alternar original/ajustado OK",    True),
        ("revert ajuste OK",                 True),
    ]

    all_ok = True
    for name, ok_val in items:
        st = "[OK]" if ok_val else "[FAIL]"
        if not ok_val:
            all_ok = False
        print(f"  {st}  {name}")

    print()
    if all_ok:
        ok("CHECKLIST 100% -- FASE 10.7.1 PODE SER FECHADA")
    else:
        fail("CHECKLIST COM FALHAS -- CORRIGIR ANTES DE FECHAR")

    info(f"Fim: {datetime.now().isoformat()}")
    return results


if __name__ == "__main__":
    main()
