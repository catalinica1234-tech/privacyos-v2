"""Genera el modelo financiero PRIVACYOS (XLSX) con fórmulas y escenarios.

Uso:  python scripts/generar-modelo-financiero.py
Salida: docs/business/modelo-financiero.xlsx
"""
from __future__ import annotations

import math
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "business" / "modelo-financiero.xlsx"
OUT.parent.mkdir(parents=True, exist_ok=True)

# ── Paleta Serenidad ──────────────────────────────────────────────
BOSQUE = "1F4D3D"
MENTA = "3AA981"
MARFIL = "F7F6F2"
GRIS = "5B6470"
LINEA = "D8D5CC"
ROJO = "B23A3A"
VERDE_CLARO = "E6F2EC"

TITLE = Font(name="Calibri", size=18, bold=True, color=BOSQUE)
SUBTITLE = Font(name="Calibri", size=11, italic=True, color=GRIS)
H1 = Font(name="Calibri", size=13, bold=True, color=BOSQUE)
H2 = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
BOLD = Font(name="Calibri", size=11, bold=True)
NORMAL = Font(name="Calibri", size=10)
SMALL = Font(name="Calibri", size=9, color=GRIS)

FILL_H = PatternFill("solid", fgColor=BOSQUE)
FILL_SOFT = PatternFill("solid", fgColor=VERDE_CLARO)
FILL_WARN = PatternFill("solid", fgColor="FBE9E7")
THIN = Side(style="thin", color=LINEA)
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CLP = '"$"#,##0'
PCT = "0.0%"
NUM = "#,##0"

MESES = 36
MILESTONES = {
    "Conservador": {0: 0, 6: 6, 12: 18, 24: 45, 36: 80},
    "Base": {0: 0, 6: 12, 12: 35, 24: 110, 36: 220},
    "Optimista": {0: 0, 6: 25, 12: 60, 24: 200, 36: 400},
}
CHURN = {"Conservador": 0.045, "Base": 0.035, "Optimista": 0.025}
ARPU_FACTOR = {"Conservador": 0.85, "Base": 1.0, "Optimista": 1.15}
MARKETING_KEY = {"Conservador": "$B$34", "Base": "$B$35", "Optimista": "$B$36"}
FIXED_MULT = {"Conservador": 0.85, "Base": 1.0, "Optimista": 1.2}


def target_curve(name: str) -> list[int]:
    ms = MILESTONES[name]
    out = []
    keys = sorted(ms)
    for mes in range(1, MESES + 1):
        lo = max(k for k in keys if k <= mes)
        hi = min(k for k in keys if k >= mes)
        if lo == hi:
            value = ms[lo]
        else:
            value = ms[lo] + (ms[hi] - ms[lo]) * (mes - lo) / (hi - lo)
        out.append(int(round(value)))
    return out


def style_cell(cell, *, font=NORMAL, fill=None, fmt=None, align=None, border=True):
    cell.font = font
    if fill:
        cell.fill = fill
    if fmt:
        cell.number_format = fmt
    if align:
        cell.alignment = align
    if border:
        cell.border = BORDER


def section(ws, row, text, last_col=8):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=last_col)
    c = ws.cell(row=row, column=1, value=text)
    c.font = H1
    c.fill = PatternFill("solid", fgColor=MARFIL)
    for col in range(1, last_col + 1):
        ws.cell(row=row, column=col).border = Border(bottom=THIN)


wb = Workbook()

# ══════════════════════════════════════════════════════════════════
# Portada
# ══════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = "Portada"
ws.sheet_view.showGridLines = False
ws.merge_cells("A1:F1")
ws["A1"] = "PRIVACYOS · Modelo financiero Hito 3"
ws["A1"].font = TITLE
ws.merge_cells("A2:F2")
ws["A2"] = "Herramienta de planificación · no constituye una proyección garantizada ni una oferta de venta"
ws["A2"].font = SUBTITLE
ws["A4"] = "Qué contiene"
ws["A4"].font = H1
textos = [
    ("Supuestos", "Parámetros editables: UF, precios, costos, CAC, impuestos y descuento."),
    ("Precios", "Planes propuestos con precio en UF y CLP; el mix define el ARPU."),
    ("Escenarios", "36 meses por escenario (conservador, base, optimista) con fórmulas."),
    ("Resumen", "Clientes, ingresos, EBITDA, caja, VAN, TIR, payback y punto de equilibrio."),
    ("Sensibilidad", "VAN pre-impuestos ante cambios de ARPU y tasa de descuento."),
]
for i, (nombre, detalle) in enumerate(textos, start=5):
    ws.cell(row=i, column=1, value=nombre).font = BOLD
    ws.merge_cells(start_row=i, start_column=2, end_row=i, end_column=6)
    ws.cell(row=i, column=2, value=detalle).font = NORMAL

ws["A11"] = "Cómo se usa"
ws["A11"].font = H1
pasos = [
    "1. Edita solo las celdas de fondo claro en «Supuestos» y las metas de clientes en «Escenarios».",
    "2. Las celdas con fórmula se recalculan al abrir el archivo en Excel, LibreOffice o Google Sheets.",
    "3. Revisa el «Resumen» y la «Sensibilidad»; no cambies fórmulas sin documentar el motivo.",
    "4. Los valores están en CLP netos (sin IVA). El IVA es un pasivo, no ingreso.",
]
for i, p in enumerate(pasos, start=12):
    ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=6)
    ws.cell(row=i, column=1, value=p).font = NORMAL

ws["A17"] = "Advertencias de honestidad"
ws["A17"].font = H1
adv = [
    "No hay clientes pagando ni ingresos reales: este modelo es una hipótesis de trabajo.",
    "Los precios, el CAC y el churn son supuestos declarados, no resultados observados.",
    "La UF de referencia es la del día de corte indicado; actualízala antes de cada presentación.",
    "El producto aún no tiene cuentas, facturación ni recuperación entre dispositivos: el modelo asume que se implementarán.",
    "VAN/TIR son herramientas de decisión, no promesas. La sensibilidad muestra cuán frágiles son.",
]
for i, a in enumerate(adv, start=18):
    ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=6)
    c = ws.cell(row=i, column=1, value="• " + a)
    c.font = NORMAL
    c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[i].height = 30

ws.merge_cells("A25:F25")
ws["A25"] = "Corte: 2026-11-02 · Autor: equipo PRIVACYOS · Moneda: CLP · UF: 41.258,26"
ws["A25"].font = SMALL
for col in range(1, 7):
    ws.column_dimensions[get_column_letter(col)].width = 26

# ══════════════════════════════════════════════════════════════════
# Supuestos
# ══════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Supuestos")
ws.sheet_view.showGridLines = False
ws["A1"] = "Supuestos editables"
ws["A1"].font = TITLE
ws["A2"] = "Solo las celdas de la columna B son entradas. Las celdas con fórmula están marcadas como tal."
ws["A2"].font = SUBTITLE

section(ws, 4, "Parámetros generales", 5)
params = [
    ("UF (CLP)", 41258.26, CLP, "mindicador.cl, 2026-11-02"),
    ("USD/CLP", 950, CLP, "Supuesto de planificación; actualizar con tipo de cambio observado."),
    ("IVA", 0.19, PCT, "Chile. Los precios del modelo son netos."),
    ("Impuesto a la renta", 0.27, PCT, "Tasa corporativa simplificada; no modela pérdidas arrastrables."),
    ("Tasa de descuento anual", 0.25, PCT, "Costo de oportunidad de un emprendimiento temprano."),
    ("Inversión inicial (CLP)", 80_000_000, CLP, "Desarrollo, marca, legal, lanzamiento y capital de trabajo inicial."),
    ("CAC de referencia (CLP)", 250_000, CLP, "Costo de adquirir un cliente pagando; se compara con el CAC implícito."),
    ("Meses del modelo", MESES, NUM, "Horizonte de 3 años."),
]
for i, (label, val, fmt, note) in enumerate(params, start=5):
    style_cell(ws.cell(row=i, column=1, value=label), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=val), font=Font(size=11, color="1F4D3D", bold=True), fill=FILL_SOFT, fmt=fmt)
    style_cell(ws.cell(row=i, column=3, value=note), font=SMALL)

section(ws, 14, "Precios propuestos (UF/mes, netos)", 5)
precios = [
    ("Esencial", 2.5, "1 espacio, 10 análisis/mes, informe exportable."),
    ("Profesional", 6.0, "1 espacio, 50 análisis/mes, asistente y comparación."),
    ("Consultora", 15.0, "Espacios separados por cliente, 250 análisis/mes, soporte prioritario."),
    ("Diagnóstico único", 10.0, "Informe + sesión de revisión (servicio, no suscripción)."),
]
for i, (nombre, uf, incluye) in enumerate(precios, start=15):
    style_cell(ws.cell(row=i, column=1, value=nombre), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=uf), font=Font(size=11, color="1F4D3D", bold=True), fill=FILL_SOFT, fmt="0.00")
    style_cell(ws.cell(row=i, column=3, value=incluye), font=SMALL)

style_cell(ws.cell(row=20, column=1, value="Mix Esencial"), font=BOLD)
style_cell(ws.cell(row=20, column=2, value=0.50), font=BOLD, fill=FILL_SOFT, fmt=PCT)
style_cell(ws.cell(row=21, column=1, value="Mix Profesional"), font=BOLD)
style_cell(ws.cell(row=21, column=2, value=0.35), font=BOLD, fill=FILL_SOFT, fmt=PCT)
style_cell(ws.cell(row=22, column=1, value="Mix Consultora"), font=BOLD)
style_cell(ws.cell(row=22, column=2, value=0.15), font=BOLD, fill=FILL_SOFT, fmt=PCT)
style_cell(ws.cell(row=23, column=1, value="ARPU ponderado (UF/mes)"), font=BOLD)
style_cell(ws.cell(row=23, column=2, value="=B15*B20+B16*B21+B17*B22"), font=Font(size=11, color="1F4D3D", bold=True), fmt="0.00")
style_cell(ws.cell(row=24, column=1, value="ARPU ponderado (CLP/mes)"), font=BOLD)
style_cell(ws.cell(row=24, column=2, value="=B23*B5"), font=Font(size=11, color="1F4D3D", bold=True), fmt=CLP)
style_cell(ws.cell(row=24, column=3, value="Celda con fórmula; alimenta los escenarios."), font=SMALL)

section(ws, 26, "Costos fijos mensuales (CLP, mes 1)", 5)
fijos = [
    ("Infraestructura (Vercel + Supabase + dominio)", 180_000, "Supuesto; varía con el plan y el tráfico."),
    ("Legal y contabilidad", 150_000, "Provisión mensual."),
    ("Herramientas y correo", 60_000, "Supuesto."),
    ("Sueldo fundador", 1_500_000, "Costo de oportunidad; no es un sueldo pagado necesariamente."),
    ("Soporte (desde mes 13)", 1_800_000, "Se activa cuando la base de clientes lo exige."),
]
for i, (label, val, note) in enumerate(fijos, start=27):
    style_cell(ws.cell(row=i, column=1, value=label), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=val), font=Font(size=11, color="1F4D3D", bold=True), fill=FILL_SOFT, fmt=CLP)
    style_cell(ws.cell(row=i, column=3, value=note), font=SMALL)

section(ws, 33, "Marketing mensual por escenario (CLP)", 5)
mkt = [("Conservador", 1_200_000), ("Base", 3_000_000), ("Optimista", 4_500_000)]
for i, (label, val) in enumerate(mkt, start=34):
    style_cell(ws.cell(row=i, column=1, value=label), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=val), font=Font(size=11, color="1F4D3D", bold=True), fill=FILL_SOFT, fmt=CLP)

section(ws, 38, "Costos variables y crecimiento", 5)
variables = [
    ("IA e infraestructura por cliente/mes (CLP)", 1_200, CLP),
    ("Soporte variable por cliente/mes (CLP)", 800, CLP),
    ("Comisión de pago (% del ingreso)", 0.035, PCT),
    ("Expansión anual del ARPU", 0.02, PCT),
    ("Crecimiento anual de costos fijos", 0.03, PCT),
    ("Crecimiento anual del marketing", 0.03, PCT),
    ("Costo de entrega y soporte (% del ingreso)", 0.08, PCT),
]
for i, (label, val, fmt) in enumerate(variables, start=39):
    style_cell(ws.cell(row=i, column=1, value=label), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=val), font=Font(size=11, color="1F4D3D", bold=True), fill=FILL_SOFT, fmt=fmt)

ws.column_dimensions["A"].width = 50
ws.column_dimensions["B"].width = 18
ws.column_dimensions["C"].width = 62
ws.freeze_panes = "A5"

# ══════════════════════════════════════════════════════════════════
# Precios
# ══════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Precios")
ws.sheet_view.showGridLines = False
ws["A1"] = "Planes y precios"
ws["A1"].font = TITLE
ws["A2"] = "Precios netos. El IVA (19 %) se suma al cobrar. Los planes asumen cuentas y facturación, aún no implementadas."
ws["A2"].font = SUBTITLE
headers = ["Plan", "UF/mes", "CLP/mes", "CLP/año", "Incluye", "Cliente ideal"]
for j, h in enumerate(headers, start=1):
    c = ws.cell(row=4, column=j, value=h)
    style_cell(c, font=H2, fill=FILL_H, align=Alignment(horizontal="center", wrap_text=True))
planes = [
    ("Esencial", "=Supuestos!B15", "1 espacio anónimo, 10 análisis/mes, informes exportables.", "Profesional independiente o pyme pequeña."),
    ("Profesional", "=Supuestos!B16", "50 análisis/mes, asistente explicativo, comparación y priorización.", "Pyme con equipo de marketing/legal."),
    ("Consultora", "=Supuestos!B17", "Espacios separados por cliente, 250 análisis/mes, soporte prioritario.", "Consultora de privacidad o estudio jurídico."),
    ("Diagnóstico único", "=Supuestos!B18", "Informe técnico + sesión de revisión de 60 minutos.", "Organización que necesita una foto inicial."),
]
for i, (nombre, uf, incluye, ideal) in enumerate(planes, start=5):
    style_cell(ws.cell(row=i, column=1, value=nombre), font=BOLD)
    style_cell(ws.cell(row=i, column=2, value=uf), fmt="0.00")
    style_cell(ws.cell(row=i, column=3, value=f"=B{i}*Supuestos!$B$5"), fmt=CLP)
    style_cell(ws.cell(row=i, column=4, value=f"=C{i}*12"), fmt=CLP)
    style_cell(ws.cell(row=i, column=5, value=incluye), font=SMALL, align=Alignment(wrap_text=True))
    style_cell(ws.cell(row=i, column=6, value=ideal), font=SMALL, align=Alignment(wrap_text=True))

ws["A12"] = "Mix de clientes (editable en Supuestos)"
ws["A12"].font = H2
ws["A12"].fill = FILL_H
for j, h in enumerate(["Plan", "Mix", "Contribución al ARPU (CLP)"], start=1):
    c = ws.cell(row=13, column=j, value=h)
    style_cell(c, font=BOLD, fill=FILL_SOFT)
for i, (nombre, cell) in enumerate([("Esencial", "B20"), ("Profesional", "B21"), ("Consultora", "B22")], start=14):
    style_cell(ws.cell(row=i, column=1, value=nombre))
    style_cell(ws.cell(row=i, column=2, value=f"=Supuestos!{cell}"), fmt=PCT)
    style_cell(ws.cell(row=i, column=3, value=f"=B{i}*Supuestos!$B${15 + (i - 14)}*Supuestos!$B$5"), fmt=CLP)
ws["A18"] = "ARPU ponderado"
ws["A18"].font = BOLD
style_cell(ws.cell(row=18, column=2, value="=SUM(B14:B16)"), font=BOLD, fmt=PCT)
style_cell(ws.cell(row=18, column=3, value="=Supuestos!B24"), font=BOLD, fmt=CLP)

ws.column_dimensions["A"].width = 22
ws.column_dimensions["B"].width = 14
ws.column_dimensions["C"].width = 18
ws.column_dimensions["D"].width = 18
ws.column_dimensions["E"].width = 58
ws.column_dimensions["F"].width = 38

# ══════════════════════════════════════════════════════════════════
# Escenarios
# ══════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Escenarios")
ws.sheet_view.showGridLines = False
ws["A1"] = "Escenarios a 36 meses"
ws["A1"].font = TITLE
ws["A2"] = "Metas de clientes = supuesto. Las demás columnas son fórmulas. Los valores son CLP netos."
ws["A2"].font = SUBTITLE

HEADERS = [
    "Mes", "Año", "Clientes objetivo", "Clientes inicio", "Churn", "Nuevos requeridos",
    "Clientes fin", "ARPU", "Ingresos", "Costo variable", "Margen contribución",
    "Costos fijos", "Marketing", "EBITDA", "Impuesto", "Flujo caja", "Caja acumulada",
    "CAC implícito", "Mes recuperación",
]
WIDTHS = [7, 7, 13, 13, 9, 13, 12, 13, 15, 15, 16, 15, 13, 15, 12, 15, 16, 14, 14]

block_rows: dict[str, tuple[int, int]] = {}
start = 4
for escenario in ["Conservador", "Base", "Optimista"]:
    ws.merge_cells(start_row=start, start_column=1, end_row=start, end_column=len(HEADERS))
    c = ws.cell(row=start, column=1, value=f"Escenario {escenario}")
    c.font = Font(size=14, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=BOSQUE)

    # Parámetros del escenario
    style_cell(ws.cell(row=start + 1, column=1, value="Churn mensual"), font=BOLD)
    style_cell(ws.cell(row=start + 1, column=2, value=CHURN[escenario]), fill=FILL_SOFT, fmt=PCT)
    style_cell(ws.cell(row=start + 1, column=3, value="ARPU base CLP"), font=BOLD)
    style_cell(ws.cell(row=start + 1, column=4, value=f"=Supuestos!$B$24*{ARPU_FACTOR[escenario]}"), fill=FILL_SOFT, fmt=CLP)
    style_cell(ws.cell(row=start + 1, column=5, value="Marketing/mes"), font=BOLD)
    style_cell(ws.cell(row=start + 1, column=6, value=f"=Supuestos!{MARKETING_KEY[escenario]}"), fill=FILL_SOFT, fmt=CLP)
    style_cell(ws.cell(row=start + 1, column=7, value="Mult. fijos"), font=BOLD)
    style_cell(ws.cell(row=start + 1, column=8, value=FIXED_MULT[escenario]), fill=FILL_SOFT, fmt="0.00")

    header_row = start + 3
    for j, h in enumerate(HEADERS, start=1):
        cell = ws.cell(row=header_row, column=j, value=h)
        style_cell(cell, font=H2, fill=FILL_H, align=Alignment(horizontal="center", wrap_text=True))
        ws.column_dimensions[get_column_letter(j)].width = WIDTHS[j - 1]

    data_start = header_row + 1
    curves = target_curve(escenario)
    for idx, objetivo in enumerate(curves):
        r = data_start + idx
        mes = idx + 1
        style_cell(ws.cell(row=r, column=1, value=mes), align=Alignment(horizontal="center"))
        style_cell(ws.cell(row=r, column=2, value=f"=ROUNDUP(A{r}/12,0)"), align=Alignment(horizontal="center"))
        style_cell(ws.cell(row=r, column=3, value=objetivo), fill=PatternFill("solid", fgColor="FFFFFF"))
        if idx == 0:
            style_cell(ws.cell(row=r, column=4, value=0))
        else:
            style_cell(ws.cell(row=r, column=4, value=f"=G{r-1}"))
        style_cell(ws.cell(row=r, column=5, value=f"=ROUND(D{r}*$B${start + 1},0)"), fmt=NUM)
        style_cell(ws.cell(row=r, column=6, value=f"=MAX(0,C{r}-D{r}+E{r})"), fmt=NUM)
        style_cell(ws.cell(row=r, column=7, value=f"=D{r}+F{r}-E{r}"), fmt=NUM, font=BOLD)
        style_cell(ws.cell(row=r, column=8, value=f"=$D${start + 1}*(1+Supuestos!$B$42)^INT((A{r}-1)/12)"), fmt=CLP)
        style_cell(ws.cell(row=r, column=9, value=f"=G{r}*H{r}"), fmt=CLP)
        style_cell(ws.cell(row=r, column=10, value=f"=G{r}*(H{r}*(Supuestos!$B$41+Supuestos!$B$45)+Supuestos!$B$39+Supuestos!$B$40)"), fmt=CLP)
        style_cell(ws.cell(row=r, column=11, value=f"=I{r}-J{r}"), fmt=CLP)
        fijos = (
            f"(Supuestos!$B$27+Supuestos!$B$28+Supuestos!$B$29+Supuestos!$B$30"
            f"+IF(A{r}>=13,Supuestos!$B$31,0))*(1+Supuestos!$B$43)^INT((A{r}-1)/12)*$H${start + 1}"
        )
        style_cell(ws.cell(row=r, column=12, value=f"={fijos}"), fmt=CLP)
        style_cell(ws.cell(row=r, column=13, value=f"=$F${start + 1}*(1+Supuestos!$B$44)^INT((A{r}-1)/12)"), fmt=CLP)
        style_cell(ws.cell(row=r, column=14, value=f"=K{r}-L{r}-M{r}"), fmt=CLP, font=BOLD)
        style_cell(ws.cell(row=r, column=15, value=f"=MAX(0,N{r}*Supuestos!$B$8)"), fmt=CLP)
        if idx == 0:
            style_cell(ws.cell(row=r, column=16, value=f"=N{r}-O{r}-Supuestos!$B$10"), fmt=CLP)
            style_cell(ws.cell(row=r, column=17, value=f"=P{r}"), fmt=CLP)
        else:
            style_cell(ws.cell(row=r, column=16, value=f"=N{r}-O{r}"), fmt=CLP)
            style_cell(ws.cell(row=r, column=17, value=f"=Q{r-1}+P{r}"), fmt=CLP)
        style_cell(ws.cell(row=r, column=18, value=f'=IF(F{r}>0,M{r}/F{r},"—")'), fmt=CLP)
        style_cell(ws.cell(row=r, column=19, value=f'=IF(Q{r}>=0,A{r},"")'))

        if idx % 2 == 1:
            for col in range(1, len(HEADERS) + 1):
                ws.cell(row=r, column=col).fill = PatternFill("solid", fgColor="FAFAF7")

    data_end = data_start + MESES - 1
    block_rows[escenario] = (data_start, data_end)
    ws.conditional_formatting.add(
        f"Q{data_start}:Q{data_end}",
        CellIsRule(operator="lessThan", formula=["0"], fill=FILL_WARN, font=Font(color=ROJO)),
    )
    start = data_end + 4

ws.freeze_panes = "A7"

# ══════════════════════════════════════════════════════════════════
# Resumen
# ══════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Resumen")
ws.sheet_view.showGridLines = False
ws["A1"] = "Resumen ejecutivo del modelo"
ws["A1"].font = TITLE
ws["A2"] = "Los valores se recalculan desde «Escenarios». VAN y TIR usan los flujos netos; la TIR se anualiza."
ws["A2"].font = SUBTITLE

cols = {"Conservador": 2, "Base": 3, "Optimista": 4}
for nombre, col in cols.items():
    c = ws.cell(row=4, column=col, value=nombre)
    style_cell(c, font=H2, fill=FILL_H, align=Alignment(horizontal="center"))
style_cell(ws.cell(row=4, column=1, value="Métrica"), font=H2, fill=FILL_H)

filas = [
    ("Clientes mes 12", "INDEX(Escenarios!$G${s}:$G${e},12)", NUM),
    ("Clientes mes 24", "INDEX(Escenarios!$G${s}:$G${e},24)", NUM),
    ("Clientes mes 36", "INDEX(Escenarios!$G${s}:$G${e},36)", NUM),
    ("Ingresos año 1", "SUMIF(Escenarios!$B${s}:$B${e},1,Escenarios!$I${s}:$I${e})", CLP),
    ("Ingresos año 2", "SUMIF(Escenarios!$B${s}:$B${e},2,Escenarios!$I${s}:$I${e})", CLP),
    ("Ingresos año 3", "SUMIF(Escenarios!$B${s}:$B${e},3,Escenarios!$I${s}:$I${e})", CLP),
    ("EBITDA año 3", "SUMIF(Escenarios!$B${s}:$B${e},3,Escenarios!$N${s}:$N${e})", CLP),
    ("Caja final (mes 36)", "INDEX(Escenarios!$Q${s}:$Q${e},36)", CLP),
    ("VAN (tasa Supuestos B9)", "SUMPRODUCT(Escenarios!$P${s}:$P${e},1/(1+Supuestos!$B$9)^((Escenarios!$A${s}:$A${e}-1)/12))", CLP),
    ("TIR anual", "IFERROR((1+IRR(Escenarios!$P${s}:$P${e}))^12-1,\"n/a\")", PCT),
    ("Payback (mes)", "IF(COUNT(Escenarios!$S${s}:$S${e})=0,\">36\",MIN(Escenarios!$S${s}:$S${e}))", NUM),
    ("Clientes de equilibrio (mes 36)", "(INDEX(Escenarios!$L${s}:$L${e},36)+INDEX(Escenarios!$M${s}:$M${e},36))/(INDEX(Escenarios!$H${s}:$H${e},36)*(1-Supuestos!$B$41-Supuestos!$B$45)-Supuestos!$B$39-Supuestos!$B$40)", NUM),
    ("CAC implícito mes 36", "INDEX(Escenarios!$R${s}:$R${e},36)", CLP),
    ("Margen bruto año 3", "1-SUMIF(Escenarios!$B${s}:$B${e},3,Escenarios!$J${s}:$J${e})/SUMIF(Escenarios!$B${s}:$B${e},3,Escenarios!$I${s}:$I${e})", PCT),
]
row = 5
for label, formula, fmt in filas:
    style_cell(ws.cell(row=row, column=1, value=label), font=BOLD)
    for nombre, col in cols.items():
        s, e = block_rows[nombre]
        f = formula.format(s=s, e=e)
        style_cell(ws.cell(row=row, column=col, value=f"={f}"), fmt=fmt, align=Alignment(horizontal="right"))
    row += 1

ws["A21"] = "Lectura"
ws["A21"].font = H1
notas = [
    "El escenario base exige ejecución comercial sostenida; el conservador prueba la resistencia del modelo.",
    "El CAC implícito se compara con el CAC de referencia: si lo supera, el marketing no es eficiente.",
    "El punto de equilibrio de clientes usa costos fijos y marketing del mes 36 y el ARPU de ese mes.",
    "La TIR se anualiza a partir de flujos mensuales: (1+TIR mensual)^12-1.",
    "El flujo del mes 1 se descuenta como momento 0, igual que la inversión inicial.",
    "La TIR puede no existir si todos los flujos son negativos; se muestra «n/a» en vez de inventarla.",
]
for i, n in enumerate(notas, start=22):
    ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=4)
    c = ws.cell(row=i, column=1, value="• " + n)
    c.font = NORMAL
    c.alignment = Alignment(wrap_text=True)

# Gráficos
ch_clientes = LineChart()
ch_clientes.title = "Clientes por escenario"
ch_clientes.y_axis.title = "Clientes"
ch_clientes.x_axis.title = "Mes"
for nombre, col in cols.items():
    s, e = block_rows[nombre]
    data = Reference(ws.parent["Escenarios"], min_col=7, min_row=s - 1, max_row=e)
    ch_clientes.add_data(data, titles_from_data=True)
    ch_clientes.series[-1].tx = None
ref = Reference(ws.parent["Escenarios"], min_col=1, min_row=s, max_row=e)
ch_clientes.set_categories(ref)
ch_clientes.height = 8
ch_clientes.width = 16
ws.add_chart(ch_clientes, "F4")

ch_caja = LineChart()
ch_caja.title = "Caja acumulada"
ch_caja.y_axis.title = "CLP"
ch_caja.x_axis.title = "Mes"
for nombre, col in cols.items():
    s, e = block_rows[nombre]
    data = Reference(ws.parent["Escenarios"], min_col=17, min_row=s - 1, max_row=e)
    ch_caja.add_data(data, titles_from_data=True)
ref = Reference(ws.parent["Escenarios"], min_col=1, min_row=s, max_row=e)
ch_caja.set_categories(ref)
ch_caja.height = 8
ch_caja.width = 16
ws.add_chart(ch_caja, "F22")

ws.column_dimensions["A"].width = 38
for col in ["B", "C", "D"]:
    ws.column_dimensions[col].width = 20

# ══════════════════════════════════════════════════════════════════
# Sensibilidad
# ══════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Sensibilidad")
ws.sheet_view.showGridLines = False
ws["A1"] = "Sensibilidad del VAN · escenario Base"
ws["A1"].font = TITLE
ws["A2"] = "VAN pre-impuestos simplificado: ignora escudo fiscal y capital de trabajo. Sirve para comparar, no para contabilidad."
ws["A2"].font = SUBTITLE

base_s, base_e = block_rows["Base"]
ws["A4"] = "ARPU base (CLP)"
ws["A4"].font = BOLD
style_cell(ws["B4"], font=BOLD, fmt=CLP)
ws["B4"] = f"=Escenarios!D{base_s - 3}"  # ARPU base del bloque Base
ws["A5"] = "Inversión inicial"
ws["A5"].font = BOLD
style_cell(ws["B5"], font=BOLD, fmt=CLP)
ws["B5"] = "=Supuestos!B10"

style_cell(ws.cell(row=6, column=1, value="Δ ARPU \\ Tasa descuento"), font=H2, fill=FILL_H)
for j, tasa in enumerate([0.15, 0.20, 0.25, 0.30, 0.35], start=2):
    c = ws.cell(row=6, column=j, value=tasa)
    style_cell(c, font=H2, fill=FILL_H, fmt=PCT, align=Alignment(horizontal="center"))
for i, delta in enumerate([-0.30, -0.20, -0.10, 0.0, 0.10, 0.20, 0.30], start=7):
    style_cell(ws.cell(row=i, column=1, value=delta), font=BOLD, fmt="+0%;-0%;0%")
    arpu = f"$B$4*(1+$A{i})"
    for j in range(2, 7):
        tasa = f"{get_column_letter(j)}$6"
        formula = (
            f"=-$B$5+SUMPRODUCT(Escenarios!$G${base_s}:$G${base_e},"
            f"({arpu}*(1-Supuestos!$B$41-Supuestos!$B$45)-Supuestos!$B$39-Supuestos!$B$40)/(1+{tasa})^((Escenarios!$A${base_s}:$A${base_e}-1)/12))"
            f"-SUMPRODUCT(Escenarios!$L${base_s}:$L${base_e}+Escenarios!$M${base_s}:$M${base_e},"
            f"1/(1+{tasa})^((Escenarios!$A${base_s}:$A${base_e}-1)/12))"
        )
        style_cell(ws.cell(row=i, column=j, value="=" + formula), fmt=CLP)

ws["A16"] = "Punto de equilibrio (clientes) según ARPU"
ws["A16"].font = H1
for j, h in enumerate(["ARPU mensual (CLP)", "Clientes de equilibrio (mes 36)", "Margen por cliente"], start=1):
    c = ws.cell(row=17, column=j, value=h)
    style_cell(c, font=H2, fill=FILL_H, align=Alignment(wrap_text=True))
for i, arpu in enumerate([80000, 120000, 150000, 180000, 220000, 280000], start=18):
    style_cell(ws.cell(row=i, column=1, value=arpu), fmt=CLP)
    style_cell(ws.cell(row=i, column=2, value=f"=(INDEX(Escenarios!$L${base_s}:$L${base_e},36)+INDEX(Escenarios!$M${base_s}:$M${base_e},36))/(A{i}*(1-Supuestos!$B$41-Supuestos!$B$45)-Supuestos!$B$39-Supuestos!$B$40)"), fmt="0.0")
    style_cell(ws.cell(row=i, column=3, value=f"=A{i}*(1-Supuestos!$B$41-Supuestos!$B$45)-Supuestos!$B$39-Supuestos!$B$40"), fmt=CLP)

ws.column_dimensions["A"].width = 32
for col in ["B", "C", "D", "E", "F"]:
    ws.column_dimensions[col].width = 20

# Propiedades
wb.properties.title = "PRIVACYOS · Modelo financiero"
wb.properties.creator = "Equipo PRIVACYOS"
wb.properties.description = "Modelo con fórmulas, escenarios y sensibilidad. Supuestos declarados."

wb.save(OUT)
print(f"OK: {OUT}")
print(f"Escenarios: {block_rows}")
