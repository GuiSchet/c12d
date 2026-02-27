# Plan: c12d — Dashboard de Análisis Bitcoin Core en Tiempo Real

## Context

b10c propuso construir visualizaciones en tiempo real usando el websocket de peer-observer (`wss://demo.peer.observer/websocket/hal/` y `wss://demo.peer.observer/websocket/len/`). La idea es combinar el frontend con IA del proyecto vistaenery-dataagent (Next.js 15 + ElevenLabs + Recharts) con el feed de eventos de Bitcoin Core del peer-observer.

El resultado es c12d: un dashboard que muestra gráficos en tiempo real del nodo Bitcoin (mensajes P2P, peers, mempool, orphanage, debug logs) y un asistente de voz/texto que explica qué significan los datos.

---

## Arquitectura general

```text
wss://demo.peer.observer/websocket/hal/
↓
BitcoinDataContext (React)
- rolling buffers por métrica (60 puntos / 10min)
- estado: PeerInfos, MempoolInfo, OrphanTxs, P2P messages, logs
↓
ShadcnChart / LogViewer (render en tiempo real)
↓
ChartContextProvider → ElevenLabs (c12d voice assistant)
↓
Respuestas explicando el grafico activo y sus anomalías
```

---

## Ubicación del proyecto

Crear el frontend en `tools/c12d/` dentro del repo peer-observer.

Actualizar el root `Cargo.toml` no es necesario (es un proyecto Node/Next.js, no Rust).

---

## Temas (Topics) y Gráficos

Reemplazar los 5 temas de Vista Energy por:

### 1. network — Actividad P2P

- **msg-types-bar:** Conteo de tipos de mensajes en los últimos 60s (bar chart: inv, tx, addr, ping, etc.)
- **msg-rate-line:** Mensajes/segundo a lo largo del tiempo (line chart)
- **connections-area:** Peers activos por tipo de conexión en el tiempo (area chart apilado)

### 2. mempool — Estado del Mempool

- **mempool-count-line:** Cantidad de transacciones en el mempool (line chart, actualizado cada 10s por RPC)
- **mempool-bytes-area:** Peso total del mempool en bytes (area chart)
- **mempool-fees-line:** Min relay fee a lo largo del tiempo (line chart)

### 3. peers — Información de Peers

- **peers-by-type-pie:** Distribución por tipo de conexión (pie chart: inbound, outbound-full, block-relay, feeler)
- **peers-by-network-pie:** Distribución por red (pie: IPv4, IPv6, Tor, I2P)
- **peers-traffic-bar:** Top 10 peers por bytes recibidos (bar horizontal)

### 4. orphans — Orphanage

- **orphan-count-line:** Cantidad de orphans a lo largo del tiempo (line chart, RPC cada 10s)
- **orphan-vsize-scatter:** Scatter plot vsize vs. cantidad de peers que lo anunciaron
- **orphan-sources-bar:** Top peers anunciando orphans (bar chart, peer_id → conteo)

### 5. logs — Debug Logs (solo en hal/)

- Componente especial `LogViewer` (no chart standard): stream en tiempo real con grep/highlight

---

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `lib/bitcoinWebSocket.ts` | Clase `BitcoinWebSocketManager` — conecta al WS, parsea JSON, emite eventos tipados |
| `lib/bitcoinDataBuffer.ts` | `RollingBuffer` — mantiene N puntos con timestamp para time series |
| `contexts/BitcoinDataContext.tsx` | Context + Provider que consume `BitcoinWebSocketManager` y expone state reactivo por topic |
| `lib/bitcoinChartTemplates.ts` | Templates de charts para los 5 temas Bitcoin (reemplaza `chartTemplates.ts`) |
| `components/LogViewer.tsx` | Componente de log viewer en tiempo real con input de filtro (grep) y highlight |
| `.env.local` | `AGENT_ID=`, `ELEVENLABS_API_KEY=`, `BITCOIN_WS_URL=wss://demo.peer.observer/websocket/hal/` |

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `components/ShadcnChart.tsx` | Reemplazar sampleDataSets hardcodeados por datos de `useBitcoinData()` hook |
| `lib/chartTemplates.ts` | Reemplazar contenido completo con `bitcoinChartTemplates.ts` (o importar desde él) |
| `components/ChartContextProvider.tsx` | Consumir `BitcoinDataContext` en lugar de datos estáticos de spec |
| `components/ConvAIWrapper.tsx` | Inicializar `BitcoinDataContext` antes del árbol de providers |
| `components/TopicWheel.tsx` | Reemplazar temas Vista Energy por temas Bitcoin |
| `components/ConvAI.tsx` | Renderizar `LogViewer` cuando el tema activo es "logs" |
| `app/page.tsx` | Rebrandear home page a "c12d" (título, descripción, colores: naranja Bitcoin `#F7931A`) |
| `app/layout.tsx` | Cambiar metadata: title "c12d — Bitcoin Core Analytics" |
| `app/api/signed-url/route.ts` | Sin cambios en código, pero apuntar a nuevo `AGENT_ID` para Bitcoin |
| `tailwind.config.ts` | Agregar color primario bitcoin: `'#F7931A'` |

---

## Implementación detallada

### `lib/bitcoinWebSocket.ts`

```typescript
// Maneja la conexión y parsing del feed del peer-observer
export type BitcoinEvent =
  | { type: 'EbpfMessage'; data: MessageEvent }
  | { type: 'EbpfConnection'; data: ConnectionEvent }
  | { type: 'RpcPeerInfos'; data: PeerInfos }
  | { type: 'RpcMempoolInfo'; data: MempoolInfo }
  | { type: 'RpcOrphanTxs'; data: OrphanTxs }
  | { type: 'LogEvent'; data: LogEvent }
// ... etc

export class BitcoinWebSocketManager {
  connect(url: string): void
  on(eventType: string, handler: (event: BitcoinEvent) => void): void
  disconnect(): void
}
```

### `contexts/BitcoinDataContext.tsx`

```typescript
interface BitcoinDataState {
  // Network
  recentMessages: TimestampedPoint<{type: string, count: number}>[] // rolling 60 points
  msgRateSeries: TimestampedPoint[]
  connectionHistory: TimestampedPoint[]

  // Mempool (from RPC, updates cada 10s)
  mempoolSeries: TimestampedPoint[]

  // Peers
  currentPeers: PeerInfo[]

  // Orphans
  orphanHistory: TimestampedPoint[] // count over time
  currentOrphans: OrphanTx[]

  // Logs
  recentLogs: LogEntry[] // últimas 500 entradas

  // Meta
  wsStatus: 'connecting' | 'connected' | 'disconnected'
  lastUpdate: Date | null
}
```

### Prompt del agente c12d (ElevenLabs dashboard)

Eres c12d, un asistente especializado en análisis del protocolo P2P de Bitcoin Core.
Tienes acceso en tiempo real a datos de un nodo Bitcoin monitoreado con peer-observer.

Cuando el usuario selecciona un gráfico, recibirás contexto estructurado con:
- El nombre y tipo del gráfico
- Los valores actuales (mínimo, máximo, promedio, tendencia)
- El número de registros procesados

Tu rol es explicar:
1. QUÉ mide ese gráfico y por qué importa en Bitcoin
2. QUÉ está viendo el usuario en este momento (¿normal? ¿anomalía?)
3. QUÉ podría causar los patrones observados (ataques, eclipse nodes, mempool congestion, etc.)

Conceptos que debes dominar:
- Protocolo P2P: inv/getdata/tx/addr/headers y sus flujos normales
- Tipos de conexión: outbound-full, outbound-block-relay, inbound, feeler
- Orphanage: qué son los orphan transactions, por qué se forman, ataques conocidos
- Mempool: dinámica de fees, congestion, RBF
- Redes: diferencias de comportamiento IPv4 vs Tor vs I2P

Responde en español. Sé conciso pero preciso. Si ves anomalías en los datos, explícalas primero.

---

## Flujo de datos en tiempo real

```text
WS message recibido (JSON)
→ BitcoinWebSocketManager.parse()
→ dispatch al tipo correcto (EbpfMessage, RpcMempoolInfo, etc.)
→ BitcoinDataContext actualiza rolling buffer
→ React re-render del ShadcnChart activo
→ ChartContextProvider extrae stats (min/max/avg) del buffer actual
→ sendContextualUpdate() al agente ElevenLabs
→ c12d puede responder preguntas sobre el gráfico
```

---

## Archivos críticos identificados

- `tools/c12d/lib/bitcoinWebSocket.ts` (nuevo)
- `tools/c12d/contexts/BitcoinDataContext.tsx` (nuevo)
- `tools/c12d/lib/bitcoinChartTemplates.ts` (nuevo)
- `tools/c12d/components/LogViewer.tsx` (nuevo)
- `tools/c12d/components/ShadcnChart.tsx` (modificar — swap de mock data)
- `tools/c12d/components/ChartContextProvider.tsx` (modificar — conectar context)
- `tools/c12d/components/TopicWheel.tsx` (modificar — temas Bitcoin)
- `tools/c12d/components/ConvAIWrapper.tsx` (modificar — inicializar WS)
- `tools/c12d/app/page.tsx` (modificar — rebrand c12d)

---

## Verificación / Testing

1. WebSocket connection: Abrir DevTools → Network → WS, verificar que llegan mensajes del nodo Bitcoin
2. Charts en tiempo real: Seleccionar tema "network" → el gráfico de msg-types-bar debe actualizarse cada ~1s con mensajes nuevos
3. Mempool: Seleccionar "mempool" → actualizaciones cada ~10s al llegar RpcMempoolInfo
4. Orphans: Seleccionar "orphans" → actualización cada ~10s con RpcOrphanTxs
5. Logs: Seleccionar "logs" → LogViewer muestra stream de debug logs con grep funcional
6. c12d assistant: Seleccionar cualquier gráfico → hablar al agente "¿qué estás viendo?" → debe responder con análisis del gráfico activo
7. Websocket fallback: Desconectar red → UI debe mostrar estado "disconnected" sin crashear

### Comandos de prueba

```bash
cd tools/c12d
npm install
npm run dev
# Abrir http://localhost:3000
```
