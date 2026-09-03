# Plan: banda de confianza del Forecast (2 handles)

> Estado: **documentado, NO implementado**. Se aplazó para evitar romper el deploy.
> Fecha: 2026-09-02 · Branch: `main` (HEAD `6399e9f`)

## Contexto / problema

El `forecastNode` tiene **dos outputs**:

- `forecastSeries` (Forecast) — tipo `series`
- `confidenceSeries` (Confidence) — tipo `series`

El objetivo es que, al conectar **ambos** outputs a un chart, se dibuje una
**banda de confianza sombreada** (forecast ± confidence) alrededor de la línea
del forecast, como un gráfico profesional.

### Lo que ya está implementado (commits en `main`)

| Commit | Cambio |
|---|---|
| `45bc901` | Auto-run del pipeline ampliado a `forecastNode`/indicadores/`mathOp`/etc. + guardia `running.value` contra bucle infinito. |
| `6399e9f` | `confidenceBand` computada en `ChartNode.vue` + `<path>` de banda sombreada en el SVG. |

### Por qué la banda **no se muestra hoy**

1. `useAIPipeline.ts` solo conecta `forecastNode.forecastSeries → overlayA`
   (línea ~148). El `confidenceSeries` **no se conecta a nada**.

2. El AI pipeline **no se modificó** (el cambio se revirtió antes de commitear).

3. `confidenceBand` en `ChartNode.vue` lee `r.forecastSeries || r.forecast` y
   `r.confidenceSeries || r.confidence`. Como el forecast llega por el handle
   `overlayA` y no por la clave `forecastSeries`, `confidenceValues` es `[]`
   → `len = 0` → la banda no se dibuja.

## Plan de implementación (pendiente)

### Paso 1 — Conectar ambos handles en el AI pipeline
Archivo: `composables/useAIPipeline.ts` (bloque `if (useForecast)`, ~line 142)

```ts
if (outputIdx.length > 0) {
  edges.push({ source: fcIdx, target: outputIdx[0], sourceHandle: 'forecastSeries', targetHandle: 'overlayA' })
  edges.push({ source: fcIdx, target: outputIdx[0], sourceHandle: 'confidenceSeries', targetHandle: 'overlayB' }) // <-- NUEVO
}
```

### Paso 2 — Propagar las claves originales en el runner (RIESGO ELEVADO)
Archivo: `utils/pipeline/runner.ts`

En la resolución de edges (~línea 281-282):

```ts
if (edge.sourceHandle && edge.targetHandle) {
  inputs[edge.targetHandle] = srcResult[edge.sourceHandle]
  inputs[edge.sourceHandle] = srcResult[edge.sourceHandle]   // <-- NUEVO (riesgo)
}
```

Esto expone `inputs.forecastSeries` / `inputs.confidenceSeries` al chartOutput,
para que el `ChartNode` pueda leerlos de forma **no ambigua** (sin depender de
qué overlay es cuál).

> **RIESGO:** añade claves extra (`sourceHandle`) a los `inputs` de TODOS los
> nodos, no solo al chart. Podría colisionar con claves existentes o alterar el
> comportamiento de otros ejecutores. Los tests (`96`) deben revisarse.

#### Alternativa de bajo riesgo (recomendada como fallback)
En vez de propagación general, acotar al chart: en el executor `chartOutput`
(~línea 39), exponer además:

```ts
return {
  price: ...,
  mainSeries: ...,
  overlayA: ...,
  overlayB: ...,
  overlayC: ...,
  forecastSeries: ctx.inputs.forecastSeries ?? ctx.inputs.overlayA ?? null,
  confidenceSeries: ctx.inputs.confidenceSeries ?? ctx.inputs.overlayB ?? null,
}
```

Pero esto **también** necesita el Paso 2 para que `ctx.inputs.forecastSeries`
esté poblado. Sin propagar, `inputs` solo tiene los `targetHandle`s
(`overlayA`/`overlayB`), por lo que se cae a la convención overlayA=forecast /
overlayB=confidence (más frágil, puede dar falsos positivos con SMA/EMA).

### Paso 3 — Ajustar `confidenceBand` en `ChartNode.vue`
- Leer centro de `r.forecastSeries || r.forecast || r.overlayA`
- Leer ancho de `r.confidenceSeries || r.confidence || r.overlayB`
- Mantener el guard `len >= 2` y el mínimo de longitudes
- **Evitar falsos positivos:** si solo hay SMA→overlayA y EMA→overlayB, NO debe
  dibujarse banda. Por eso el Paso 2 (claves específicas) es el camino limpio.

### Paso 4 — Tests + commit por concern
- Ejecutar `node --experimental-strip-types --test 'test/**/*.test.ts'`
  (esperado: 96+, sin fallos). Revisar si los tests existentes dependen de que
  NO exista la clave por `sourceHandle` en los inputs.
- Un commit por concern:
  - `feat(ai-pipeline): connect forecast confidenceSeries to chart`
  - `feat(pipeline): propagate source handle values to input`
  - `feat(chart): render confidence band from forecast handles`
- `git push origin main` por concern (dispara deploy automático).

## Archivos implicados
- `composables/useAIPipeline.ts` — conectar `confidenceSeries → overlayB`
- `utils/pipeline/runner.ts` — propagar claves por `sourceHandle` (risky)
- `components/pipeline/nodes/ChartNode.vue` — `confidenceBand` ya existe; afinar lectura de aliases
- `test/pipeline.test.ts` — verificar/ampliar si procede

## Estado
- [x] `ChartNode.vue`: `confidenceBand` + `<path>` de banda (commit `6399e9f`)
- [x] Paso 1: conectar `confidenceSeries` en `useAIPipeline.ts` (commit `91e1517`)
- [x] Paso 2: propagar `sourceHandle` en `runner.ts` + `chartOutput` expone `forecastSeries`/`confidenceSeries` (commit `870866e`)
- [x] Paso 3: afinar lectura de aliases en `confidenceBand` + omitir línea overlayB redundante (commit `25d6b32`)
- [x] Paso 4: test de integración propagación + commits por concern + push (commit `fef6e68`, 97 tests verdes)

## Follow-up pendiente (no bloqueante, otro día)
El fallback `parseKeywords` en `useAIPipeline.ts` para una query de **forecast puro**
(sin palabras `chart`/`candle`) no crea ningún nodo `chartOutput`, dejando el
forecast huérfano. Esto es **pre-existente** (afecta también a `forecastSeries→overlayA`)
y quedó fuera de alcance. Considerar crear el nodo chart (priceFeed→mainSeries,
forecast→overlayA, confidence→overlayB) dentro del bloque `if (useForecast)` cuando
`outputIdx` está vacío.
