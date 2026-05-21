# -*- coding: utf-8 -*-
"""
Final bugfix smoke tests for replanning risk levels and validation rounds.

Runs against the local FastAPI app by default:
    python backend/test_final_bugfix_replanning_validation.py

Runs against a deployed API when --base-url is provided:
    python backend/test_final_bugfix_replanning_validation.py --base-url https://agroplan-ai-api.onrender.com
"""

import argparse
import copy
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DEBUG_ERRORS", "true")


CALENDAR_PAYLOAD = {
    "cultura": "milho",
    "planting_date": "2026-05-10",
    "usar_clima": False,
    "field": {
        "name": "Talhao Teste Bugfix Final",
        "area_ha": 10,
        "soil_type": "argiloso",
        "slope": "plano",
        "water_availability": "media",
    },
}

REPLANNING_EVENT = {
    "event_type": "missed_irrigation",
    "date": "2026-05-15",
    "description": "Nao foi possivel irrigar nesse dia",
    "affected_task_id": None,
    "severity": None,
    "notes": None,
}


class ApiClient:
    def __init__(self, base_url=None):
        self.base_url = base_url.rstrip("/") if base_url else None
        if self.base_url:
            import requests

            self.session = requests.Session()
        else:
            from fastapi.testclient import TestClient

            os.chdir(BACKEND_DIR)
            from api import app

            self.session = TestClient(app)

    def post(self, path, payload, timeout=120):
        if self.base_url:
            response = self.session.post(f"{self.base_url}{path}", json=payload, timeout=timeout)
        else:
            response = self.session.post(path, json=payload)
        if response.status_code >= 400:
            raise AssertionError(f"POST {path} returned {response.status_code}: {response.text}")
        return response.json()


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def ok(message):
    print(f"[OK] {message}")


def test_replanning_risk_levels(client):
    calendar = client.post("/planejamento/calendario", CALENDAR_PAYLOAD)
    assert_true(calendar.get("tasks"), "calendar should contain tasks")
    ok("calendar generated")

    replanning = client.post(
        "/planejamento/replanejar",
        {"calendar": calendar, "event": REPLANNING_EVENT},
    )
    suggestions = replanning.get("suggestions", [])
    assert_true(suggestions, "replanning should return at least one suggestion")

    suggestion = suggestions[0]
    risk_level = suggestion.get("risk_level")
    assert_true(risk_level in {"baixo", "medio", "alto"}, f"unexpected risk_level: {risk_level!r}")
    assert_true(not str(risk_level).startswith("RiskLevel."), "risk_level leaked as enum name")
    ok(f"risk_level returned as API value: {risk_level}")

    applied = client.post(
        "/planejamento/replanejar/aplicar",
        {"calendar": calendar, "suggestion": suggestion, "event": REPLANNING_EVENT},
    )
    assert_true(applied.get("applied_suggestion"), "apply response should include applied_suggestion")
    ok("apply accepts normalized risk_level")

    legacy_suggestion = copy.deepcopy(suggestion)
    legacy_suggestion["risk_level"] = "RiskLevel.ALTO"
    legacy_applied = client.post(
        "/planejamento/replanejar/aplicar",
        {"calendar": calendar, "suggestion": legacy_suggestion, "event": REPLANNING_EVENT},
    )
    legacy_risk = legacy_applied.get("applied_suggestion", {}).get("risk_level")
    assert_true(legacy_risk == "alto", f"legacy risk_level should normalize to alto, got {legacy_risk!r}")
    ok("apply accepts legacy RiskLevel.ALTO")


def test_rodadas(client):
    rapido = client.post(
        "/rodadas",
        {"objetivo": "equilibrado", "rodadas": 5, "modo": "rapido"},
        timeout=180,
    )
    for field in ("config", "modo", "melhor_fitness", "fitness_medio", "estabilidade"):
        assert_true(field in rapido, f"rapido response missing {field}")
    assert_true(rapido["modo"] == "rapido", "rapido response should preserve mode")
    ok("/rodadas rapido returned numeric statistics")

    normal = client.post(
        "/rodadas",
        {"objetivo": "equilibrado", "rodadas": 10, "modo": "normal"},
        timeout=240,
    )
    assert_true(normal.get("modo") == "normal", "normal response should preserve mode")
    assert_true("melhor_fitness" in normal, "normal response missing melhor_fitness")
    ok("/rodadas normal returned successfully")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", help="Optional API base URL, e.g. https://agroplan-ai-api.onrender.com")
    args = parser.parse_args()

    target = args.base_url or "local TestClient"
    print(f"[INFO] Running final bugfix tests against {target}")

    client = ApiClient(args.base_url)
    test_replanning_risk_levels(client)
    test_rodadas(client)
    ok("final bugfix tests passed")


if __name__ == "__main__":
    main()
