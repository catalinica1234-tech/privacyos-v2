# Supuestos del modelo financiero

> **Naturaleza del documento.** El modelo es una **hipótesis de planificación**, no una proyección, una valorización ni una oferta. Los precios, el CAC y la demanda son supuestos declarados, no resultados observados. Ningún cliente, ingreso o conversión de este documento es real.

- Archivo: [`modelo-financiero.xlsx`](modelo-financiero.xlsx)
- Script de generación: [`../../scripts/generar-modelo-financiero.py`](../../scripts/generar-modelo-financiero.py)
- Script de validación: [`../../scripts/validar-modelo-financiero.py`](../../scripts/validar-modelo-financiero.py)
- Horizonte: 36 meses. Tres escenarios: conservador, base y optimista.

## 1. Parámetros generales

| Parámetro | Valor | Comentario |
|---|---:|---|
| UF | CLP 41.258,26 | Valor de referencia al 2026-11-02. Es un insumo, no una promesa de precio. |
| USD/CLP | 950 | Supuesto de conversión para costos en dólares. |
| IVA | 19 % | Se suma al precio neto al cobrar. |
| Impuesto a la renta | 27 % | Simplificación; no reemplaza asesoría tributaria. |
| Tasa de descuento anual | 25 % | Refleja el riesgo de un producto temprano; es una decisión, no un dato de mercado. |
| Inversión inicial | CLP 80.000.000 | Desarrollo, legal, infraestructura, marketing de lanzamiento y capital de trabajo. |
| CAC de referencia | CLP 250.000 | Techo de eficiencia comercial; se compara con el CAC implícito de cada escenario. |
| Meses | 36 | Horizonte de evaluación. |

La inversión inicial se trata como flujo en el momento 0. El flujo del mes 1 también se descuenta como momento 0 para no regalar un mes de descuento. La TIR se anualiza desde flujos mensuales: `(1 + TIR mensual)^12 − 1`.

## 2. Precios propuestos

Precios **netos**, en UF y CLP. El IVA se agrega al cobrar. Los planes suponen cuentas y facturación, capacidades **aún no implementadas** en el producto actual; por eso son hipótesis comerciales, no una lista de precios vigente.

| Plan | UF/mes | CLP/mes (UF 41.258,26) | Incluye (propuesta) | Cliente ideal |
|---|---:|---:|---|---|
| Esencial | 2,5 | 103.146 | 1 espacio anónimo, 10 análisis/mes, informes exportables. | Profesional independiente o pyme pequeña. |
| Profesional | 6,0 | 247.550 | 50 análisis/mes, asistente explicativo, comparación y priorización. | Pyme con equipo de marketing/legal. |
| Consultora | 15,0 | 618.874 | Espacios separados por cliente, 250 análisis/mes, soporte prioritario. | Consultora de privacidad o estudio jurídico. |
| Diagnóstico único | 10,0 (pago único) | 412.583 | Informe técnico + sesión de revisión de 60 minutos. | Organización que necesita una foto inicial. |

**Mezcla de clientes:** 50 % Esencial, 35 % Profesional y 15 % Consultora. ARPU ponderado: **5,6 UF/mes ≈ CLP 231.046/mes**. La mezcla es un supuesto; un cambio en ella mueve el punto de equilibrio.

## 3. Costos

### Costos fijos mensuales (mes 1)

| Concepto | CLP/mes |
|---|---:|
| Infraestructura (Vercel + Supabase + dominio) | 180.000 |
| Legal y contabilidad | 150.000 |
| Herramientas y correo | 60.000 |
| Sueldo fundador | 1.500.000 |
| **Total** | **1.890.000** |

Desde el mes 13 se agrega soporte por **CLP 1.800.000/mes**. Los costos fijos crecen 3 % anual.

### Costos variables y crecimiento

| Concepto | Valor |
|---|---:|
| IA e infraestructura por cliente/mes | CLP 1.200 |
| Soporte variable por cliente/mes | CLP 800 |
| Comisión de pago | 3,5 % del ingreso |
| Costo de entrega y soporte | 8 % del ingreso |
| Expansión anual del ARPU | 2 % |
| Crecimiento anual del marketing | 3 % |

El costo de entrega de 8 % se suma a los costos variables por cliente. En el modelo, el margen bruto del año 3 queda en torno a **87,7 %**, coherente con un SaaS de bajo costo marginal, pero **no validado con contabilidad real**.

### Marketing mensual por escenario

| Escenario | CLP/mes |
|---|---:|
| Conservador | 1.200.000 |
| Base | 3.000.000 |
| Optimista | 4.500.000 |

## 4. Escenarios y resultados

Los valores fueron verificados con `python scripts/validar-modelo-financiero.py`, que reconstruye el modelo en forma independiente y compara celda por celda. La última ejecución terminó con **todas las comprobaciones coincidentes**.

| Métrica | Conservador | Base | Optimista |
|---|---:|---:|---:|
| Clientes mes 12 | 18 | 35 | 60 |
| Clientes mes 24 | 45 | 110 | 200 |
| Clientes mes 36 | 80 | 220 | 400 |
| Ingresos año 1 (CLP) | 19,4 M | 45,1 M | 95,4 M |
| Ingresos año 2 (CLP) | 78,3 M | 214,0 M | 441,8 M |
| Ingresos año 3 (CLP) | 156,7 M | 489,2 M | 1.022,8 M |
| EBITDA año 3 (CLP) | 82,0 M | 343,7 M | 784,1 M |
| Caja final mes 36 (CLP) | −26,5 M | 227,1 M | 691,2 M |
| VAN (25 %) | −54,7 M | **+96,9 M** | +383,7 M |
| TIR anual | −12,54 % | **70,33 %** | 173,30 % |
| Payback | > 36 meses | **26 meses** | 20 meses |
| Clientes de equilibrio (mes 36) | 25,7 | 33,7 | 39,0 |
| CAC implícito (mes 36) | CLP 212.180 | CLP 198.919 | CLP 176.817 |
| Margen bruto año 3 | 87,52 % | 87,67 % | 87,78 % |

**Lectura honesta:**

- El escenario base **no es el más probable**: es el que exige ejecución comercial sostenida. Su TIR de 70,3 % es atractiva, pero depende de captar 220 clientes en 36 meses con un CAC implícito bajo el techo de CLP 250.000.
- El escenario conservador **destruye valor** (VAN negativo, TIR negativa, payback fuera del horizonte). No se maquilla: es la prueba de resistencia del modelo.
- El escenario optimista es un techo, no una promesa. Requiere 400 clientes y un rendimiento de marketing que no está probado.
- La caja del escenario conservador es negativa al mes 36: en la práctica exigiría capital adicional o un recorte de costos. El modelo no simula ese rescate.

## 5. Punto de equilibrio y sensibilidad

- **Punto de equilibrio de clientes:** costos fijos + marketing del mes 36, dividido por el ARPU de ese mes. En el escenario base son **33,7 clientes**; por debajo de esa cifra el mes 36 no cubre la estructura.
- **Sensibilidad del VAN (base):** se mueve principalmente por el ARPU y la inversión inicial. Una caída sostenida del ARPU o un aumento del CAC puede llevar el VAN a terreno negativo aunque el crecimiento de clientes se mantenga.
- **CAC implícito:** en los tres escenarios queda bajo el CAC de referencia de CLP 250.000, pero el margen es estrecho en el conservador (CLP 212.180). Un aumento de 20 % en el costo de adquisición borra esa ventaja.
- **Limitaciones:** el modelo ignora capital de trabajo detallado, estacionalidad, morosidad, impuestos específicos, financiamiento y escudo fiscal. La sensibilidad es un análisis de comparación, no contabilidad.

## 6. Qué falta para convertir esto en un caso defendible

1. **Pilotos pagados** con precios reales, no intención de compra.
2. **CAC observado** de al menos dos canales, con costo por lead y tasa de cierre.
3. **Churn medido** durante 3–6 meses; hoy 3,5 % mensual (base) es un supuesto.
4. **Costos reales** de infraestructura, IA y soporte, no estimaciones.
5. **Validación legal** de los planes y del tratamiento de datos personales.
6. **Decisión de financiamiento**: el escenario conservador requiere capital adicional; el base asume que la inversión inicial alcanza.

## 7. Reproducibilidad

```bash
python scripts/generar-modelo-financiero.py
python scripts/validar-modelo-financiero.py
```

La validación compara los valores del `.xlsx` con una reconstrucción independiente en Python. Si una fórmula se rompe o un supuesto cambia sin recalcular, la validación falla. El modelo tiene fórmulas vivas en las hojas `Escenarios`, `Resumen` y `Sensibilidad`; las celdas editables están en `Supuestos`.

> **Al abrir el archivo:** el `.xlsx` se generó con fórmulas, pero sin valores cacheados. Excel o LibreOffice recalculan al abrir. Si se usa un visor que no calcula, las celdas de resumen pueden verse vacías; no significa que el modelo esté roto. La validación reproducible es el script de Python.

> **Advertencia final:** cualquier cifra de este documento que se cite fuera de contexto debe ir acompañada de “supuesto de planificación”. Presentarla como resultado, proyección validada o garantía sería incorrecto.
