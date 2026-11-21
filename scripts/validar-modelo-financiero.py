"""Valida el modelo financiero XLSX contra un cálculo independiente.

Comprueba que las fórmulas del libro se evalúan sin errores y que los
resultados del motor de fórmulas coinciden con una reconstrucción en
Python de los mismos supuestos. No es una auditoría contable: es una
prueba de coherencia interna y de reproducibilidad.

Uso:
    pip install formulas openpyxl
    python scripts/validar-modelo-financiero.py

Salida: código 0 si todo coincide dentro de tolerancia; 1 si hay fallos.
"""
from __future__ import annotations

import math
import re
import sys
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "docs" / "business" / "modelo-financiero.xlsx"

SCENARIOS = ("Conservador", "Base", "Optimista")
MARKETING_CELL = {"Conservador": "B34", "Base": "B35", "Optimista": "B36"}
TOL_MONEY = 1.0  # CLP
TOL_RATE = 1e-6


def round_half_up(value: float) -> int:
    """Equivalente a ROUND(value, 0) de Excel (mitad hacia arriba)."""
    return int(math.floor(value + 0.5)) if value >= 0 else int(math.ceil(value - 0.5))


def build_model() -> tuple[dict, dict]:
    """Lee los supuestos del libro y reconstruye los escenarios en Python."""
    wb = load_workbook(XLSX, data_only=False)
    sup = wb["Supuestos"]
    esc = wb["Escenarios"]

    arpu_uf = (
        float(sup["B15"].value) * float(sup["B20"].value)
        + float(sup["B16"].value) * float(sup["B21"].value)
        + float(sup["B17"].value) * float(sup["B22"].value)
    )
    inputs = {
        "uf": float(sup["B5"].value),
        "iva": float(sup["B6"].value),
        "tax": float(sup["B8"].value),
        "discount": float(sup["B9"].value),
        "initial": float(sup["B10"].value),
        "arpu_uf": arpu_uf,
        "arpu_clp": arpu_uf * float(sup["B5"].value),
        "fixed": [float(sup[f"B{r}"].value) for r in range(27, 31)],
        "support_from_13": float(sup["B31"].value),
        "ia": float(sup["B39"].value),
        "support_var": float(sup["B40"].value),
        "commission": float(sup["B41"].value),
        "arpu_growth": float(sup["B42"].value),
        "fixed_growth": float(sup["B43"].value),
        "mkt_growth": float(sup["B44"].value),
        "delivery": float(sup["B45"].value),
    }

    blocks: dict[str, dict] = {}
    for row in range(1, esc.max_row + 1):
        label = esc.cell(row=row, column=1).value
        if isinstance(label, str) and label.startswith("Escenario "):
            name = label.split(" ", 1)[1]
            param = row + 1
            data_start = row + 4
            formula = str(esc.cell(row=param, column=4).value)
            match = re.search(r"\*\s*([0-9.]+)\s*$", formula)
            arpu_factor = float(match.group(1)) if match else 1.0
            blocks[name] = {
                "churn": float(esc.cell(row=param, column=2).value),
                "arpu": inputs["arpu_clp"] * arpu_factor,
                "marketing": float(sup[MARKETING_CELL[name]].value),
                "fixed_mult": float(esc.cell(row=param, column=8).value),
                "targets": [int(esc.cell(row=data_start + i, column=3).value) for i in range(36)],
            }

    results: dict[str, dict] = {}
    for name, cfg in blocks.items():
        clients = 0
        cash = 0.0  # El flujo del mes 1 ya incluye la inversión inicial.
        flows: list[float] = []
        rows: list[dict] = []
        for month, target in enumerate(cfg["targets"], start=1):
            churn = round_half_up(clients * cfg["churn"])
            new = max(0, target - clients + churn)
            end = clients + new - churn
            arpu = cfg["arpu"] * (1 + inputs["arpu_growth"]) ** ((month - 1) // 12)
            revenue = end * arpu
            variable = end * (
                arpu * (inputs["commission"] + inputs["delivery"])
                + inputs["ia"]
                + inputs["support_var"]
            )
            fixed = (
                sum(inputs["fixed"])
                + (inputs["support_from_13"] if month >= 13 else 0)
            ) * (1 + inputs["fixed_growth"]) ** ((month - 1) // 12) * cfg["fixed_mult"]
            marketing = cfg["marketing"] * (1 + inputs["mkt_growth"]) ** ((month - 1) // 12)
            ebitda = revenue - variable - fixed - marketing
            tax = max(0.0, ebitda * inputs["tax"])
            flow = ebitda - tax
            if month == 1:
                flow -= inputs["initial"]
            cash += flow
            flows.append(flow)
            rows.append(
                {
                    "month": month,
                    "clients": end,
                    "new": new,
                    "arpu": arpu,
                    "revenue": revenue,
                    "variable": variable,
                    "fixed": fixed,
                    "marketing": marketing,
                    "ebitda": ebitda,
                    "flow": flow,
                    "cash": cash,
                    "cac": marketing / new if new > 0 else None,
                    "payback": month if cash >= 0 else None,
                }
            )
            clients = end

        # VAN: el mes 1 se trata como momento 0 (igual que la inversión).
        van = sum(f / (1 + inputs["discount"]) ** ((m - 1) / 12) for m, f in enumerate(flows, start=1))

        # TIR mensual por bisección; luego se anualiza.
        def npv(rate: float) -> float:
            return sum(f / (1 + rate) ** i for i, f in enumerate(flows))

        lo, hi = -0.9999, 10.0
        for _ in range(300):
            mid = (lo + hi) / 2
            if npv(mid) > 0:
                lo = mid
            else:
                hi = mid
        monthly_irr = (lo + hi) / 2
        annual_irr = (1 + monthly_irr) ** 12 - 1

        years = {1: [], 2: [], 3: []}
        for row in rows:
            years[math.ceil(row["month"] / 12)].append(row)
        last = rows[-1]
        equilibrium = (last["fixed"] + last["marketing"]) / (
            last["arpu"] * (1 - inputs["commission"] - inputs["delivery"])
            - inputs["ia"]
            - inputs["support_var"]
        )
        results[name] = {
            "clients_12": rows[11]["clients"],
            "clients_24": rows[23]["clients"],
            "clients_36": rows[35]["clients"],
            "revenue_1": sum(r["revenue"] for r in years[1]),
            "revenue_2": sum(r["revenue"] for r in years[2]),
            "revenue_3": sum(r["revenue"] for r in years[3]),
            "ebitda_3": sum(r["ebitda"] for r in years[3]),
            "cash_36": last["cash"],
            "van": van,
            "irr": annual_irr,
            "payback": min((r["payback"] for r in rows if r["payback"]), default=">36"),
            "equilibrium": equilibrium,
            "cac": last["cac"],
            "gross_margin_3": 1
            - sum(r["variable"] for r in years[3]) / sum(r["revenue"] for r in years[3]),
        }

    return inputs, results


def read_formula_results() -> dict:
    """Evalúa el XLSX con el motor `formulas` y extrae el Resumen."""
    try:
        import formulas  # type: ignore
    except ImportError:
        print("FALTA: instala `formulas` y `openpyxl` para validar el XLSX.")
        raise SystemExit(2)

    model = formulas.ExcelModel().loads(str(XLSX)).finish()
    solution = model.calculate()
    prefix = f"'[{XLSX.name}]RESUMEN'!"

    def cell(ref: str):
        value = solution[prefix + ref].value
        try:
            return value[0, 0]
        except Exception:
            return value

    rows = {
        "clients_12": 5,
        "clients_24": 6,
        "clients_36": 7,
        "revenue_1": 8,
        "revenue_2": 9,
        "revenue_3": 10,
        "ebitda_3": 11,
        "cash_36": 12,
        "van": 13,
        "irr": 14,
        "payback": 15,
        "equilibrium": 16,
        "cac": 17,
        "gross_margin_3": 18,
    }
    out = {}
    for name, col in (("Conservador", "B"), ("Base", "C"), ("Optimista", "D")):
        out[name] = {key: cell(f"{col}{row}") for key, row in rows.items()}
    return out


def same(key: str, expected, actual) -> bool:
    if isinstance(expected, str) or isinstance(actual, str):
        return str(expected).strip() == str(actual).strip()
    if expected is None or actual is None:
        return expected is actual
    tolerance = TOL_RATE if key in {"irr", "gross_margin_3"} else TOL_MONEY
    return abs(float(expected) - float(actual)) <= tolerance


def main() -> int:
    if not XLSX.exists():
        print(f"FALTA: {XLSX}")
        return 2
    inputs, independent = build_model()
    formula = read_formula_results()

    print("Validación del modelo financiero")
    print(f"Archivo: {XLSX}")
    print(f"UF={inputs['uf']:.2f} CLP; inversión inicial={inputs['initial']:,.0f} CLP")
    print("")
    failures = 0
    for scenario in SCENARIOS:
        print(f"[{scenario}]")
        for key, expected in independent[scenario].items():
            actual = formula[scenario][key]
            ok = same(key, expected, actual)
            failures += 0 if ok else 1
            shown_expected = f"{expected:,.4f}" if isinstance(expected, float) else str(expected)
            shown_actual = f"{actual:,.4f}" if isinstance(actual, float) else str(actual)
            print(f"  {'OK ' if ok else 'FALLA'} {key:16} modelo={shown_expected:>18} xlsx={shown_actual:>18}")
        print("")

    if failures:
        print(f"RESULTADO: {failures} diferencias fuera de tolerancia.")
        return 1
    print("RESULTADO: todas las comprobaciones coinciden dentro de tolerancia.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
