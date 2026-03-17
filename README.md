# 🍣 Satori Dashboard · Saloneros

Dashboard de performance para el equipo de salón del restaurante **Satori Sushi** (Costa Rica).
Desarrollado iterativamente con Claude (Anthropic) — Marzo 2026.

---

## 🌐 URL de producción
**[cachosatori.github.io/satori-dashboard](https://cachosatori.github.io/satori-dashboard/)**

---

## 📐 Arquitectura

```
XLS del PoS (BIFF8/OLE2)
    ↓ parser JavaScript en el browser
Dashboard HTML (index.html)
    ↓ fetch GET/POST
Google Apps Script (Web App)
    ↓ read/write
Google Sheets (base de datos)
    ↑ sync al cargar
Cualquier dispositivo (PC, tablet, iPhone)
```

### Stack
| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JS vanilla (sin frameworks) |
| Hosting | GitHub Pages (gratuito) |
| Backend | Google Apps Script (Web App) |
| Base de datos | Google Sheets |
| Cache offline | localStorage (fallback) |
| Parser XLS | BIFF8/OLE2 custom en JavaScript |

---

## 📁 Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `index.html` | Dashboard completo (single-file app) |
| `satori_apps_script.js` | Backend Google Apps Script |
| `README.md` | Este archivo |

---

## 🚀 Setup inicial (una sola vez)

### 1. Google Sheets + Apps Script
1. Crear un Google Sheet nuevo → nombrar **"Satori Dashboard"**
2. **Extensiones → Apps Script**
3. Pegar el contenido de `satori_apps_script.js`
4. Guardar → **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
5. Copiar la URL generada

### 2. Dashboard
1. Editar `index.html` — buscar la línea:
   ```javascript
   let BACKEND_URL = localStorage.getItem('satori_backend_url') || 'TU_URL_AQUI';
   ```
2. Reemplazar `TU_URL_AQUI` con la URL del Apps Script
3. Subir como `index.html` en el repositorio GitHub

### 3. GitHub Pages
- Settings → Pages → Branch: main → / (root) → Save
- URL: `https://[usuario].github.io/[repositorio]/`

---

## 🔄 Actualizar el dashboard

Cuando hay una nueva versión del `index.html`:
1. Ir al repositorio en GitHub
2. Clic en `index.html` → lápiz ✏️ → pegar nuevo contenido
3. O: **Add file → Upload files** → reemplazar `index.html`
4. GitHub Pages se actualiza automáticamente en ~1 minuto

Cuando hay una nueva versión del Apps Script:
1. Apps Script → pegar nuevo código → Guardar
2. **Implementar → Gestionar implementaciones → ✏️ → Nueva versión → Implementar**
3. La URL no cambia

---

## 📊 Fuente de datos

### Formato XLS
El PoS genera archivos `.xls` formato **BIFF8/OLE2** con 30 columnas:

| Col | Excel | Nombre | Usado |
|---|---|---|---|
| 0 | A | Salonero | ✅ clave principal |
| 1 | B | Producto | ✅ identificar PAX |
| 2 | C | Cantidad | ✅ PAX count |
| 3 | D | MontoTotal | ✅ ventas netas |
| 4 | E | IVA | ✅ para calcular neto |
| 5 | F | Servicio | ✅ distinguir salon vs delivery |
| 8 | I | ComidasMesero | ✅ cantidad platos |
| 9 | J | BebidasMesero | ✅ cantidad bebidas |
| 11 | L | VentasBebidasMesero | ✅ monto bebidas |
| 12 | M | VentasComidasMesero | ✅ monto comidas |
| 14 | O | VentasTotalesMesero | ✅ total (bruto) |
| 29 | AD | TipoVenta | referencia |

### Cálculo del neto
```
Total neto = VentasTotalesMesero (col O) - suma(IVA col E) - suma(Servicio col F)
```
IVA = 13%, Servicio = 10% para productos en salón.
Productos delivery/take away: IVA 13%, Servicio 0%.

### Identificación de cajeros
```javascript
const CAJEROS_IDS = ['cajero turno mañana', 'cajero turno manana', 'cajero turno tarde'];
```
- **Servicio > 0** → venta en salón
- **Servicio = 0** → delivery / take away

---

## 🐛 Bugs resueltos (histórico)

| Bug | Causa | Fix |
|---|---|---|
| PAX = 0 en todos | Parser MULRK offset `pos+8` → debía ser `pos+10` | Corregido en parser JS |
| Fechas corruptas en Sheets | Google Sheets auto-convierte strings a Date | Apps Script: `setNumberFormat('@STRING@')` + normalización YYYY-MM-DD |
| Duplicados al sincronizar | Fecha como objeto Date no matcheaba string | Normalización en `syncFromCloud()` y `getDias()` |
| Totales inflados 23% | `VentasTotalesMesero` incluye IVA+Servicio | Restar suma de cols E+F |
| Saloneros faltantes en resumen | `if(!pax || !total) return` descartaba válidos | Fix con parser MULRK correcto |

---

## 📱 Vistas del dashboard

### Manager
| Pestaña | Descripción |
|---|---|
| Resumen | KPIs del día + total restaurante + ranking saloneros |
| Histórico | Gráfico evolución Prom/PAX + KPIs del período |
| Por Salonero | Detalle individual con histórico y productos |
| 📅 Por Día | Análisis por día de semana + matriz salonero×día |
| 🧾 Cajeros | Ventas delivery vs salón + histórico + día de semana |
| 📊 Evaluación | Evaluación de equipo + metas mensuales + tendencias |
| 📂 Subir XLS | Upload masivo con detección de fecha por nombre |
| 🏆 Competencias | Sistema de competencias entre saloneros |

### Salonero (vista personal)
| Pestaña | Descripción |
|---|---|
| Mi día | KPIs personales del último día |
| Mi historial | Evolución histórica personal |
| 📅 Mi semana | Rendimiento por día de semana + vs promedio restaurante |
| 🏆 Mis competencias | Competencias en las que participa |

---

## 📐 Métricas implementadas

### Por salonero
- **Prom/PAX** — ventas netas ÷ comensales atendidos
- **Beb/PAX** — bebidas vendidas ÷ comensales (semáforo: 🟢≥1.2 🟡0.8-1.2 🔴<0.8)
- **Ratio C/B en ₡** — ventas comidas ÷ ventas bebidas (ideal 2.5-4.5)
- **Ratio C/B en uds** — platos ÷ bebidas (ideal 1.5-3.5)
- **Prom/Plato** — ventas comidas ÷ cantidad platos
- **Consistencia** — % días sobre el promedio general
- **Tendencia** — primera mitad vs segunda mitad del período

### Restaurante general
- Ventas totales (saloneros + cajeros)
- % Salón vs % Delivery del total
- PAX totales, Prom/PAX general

---

## 🗂️ Estructura de datos (localStorage + Google Sheets)

```javascript
// DIAS
{
  "2026-03-13": {
    fileName: "salon 13 03 2026.xls",
    uploadedAt: "2026-03-13",
    saloneros: {
      "Rocio": {
        pax: 12, total: 348182.6,
        com: 277517.43, beb: 70665.17,
        iCom: 38, iBeb: 16,
        promPax: 29015.22, promPlato: 7303.09,
        bebPax: 1.33, ratioCB: 3.93, ratioU: 2.4,
        prods: [["SPICY TUNA ROLL", 3, 25212], ...]
      },
      "Cajero Turno Mañana": {
        esCajero: true,
        total: 42460, salon: 0, delivery: 42460,
        ordenes: 6, ticketProm: 7077
      }
    }
  }
}

// METAS
{
  restaurante: { "2026-03": 15000000 },
  saloneros: { "Rocio": 25000, "Dolores": 18000 }
}
```

---

## 🗓️ Roadmap

### ✅ Fase 1 — HTML + localStorage (COMPLETADA)
- [x] Parser BIFF8/OLE2 en JavaScript
- [x] Dashboard con 8 vistas manager + 4 salonero
- [x] Métricas: Prom/PAX, Beb/PAX, ratio C/B (₡ y uds), consistencia, tendencia
- [x] Análisis por día de semana
- [x] Competencias entre saloneros
- [x] Upload masivo con detección de fecha por nombre
- [x] Evaluación de equipo + metas mensuales e individuales
- [x] Sección cajeros/delivery con desglose salón vs delivery

### ✅ Fase 2 — Google Sheets backend (COMPLETADA)
- [x] Apps Script Web App como API
- [x] Sync automático al cargar
- [x] Push a la nube al subir XLS
- [x] Hosting en GitHub Pages
- [x] Multi-dispositivo sincronizado

### 🔲 Fase 3 — PWA instalable (PENDIENTE)
- [ ] `manifest.json` para instalar como app
- [ ] Service Worker para funcionamiento offline
- [ ] Icono y splash screen

### 🔲 Fase 4 — PIN manager + seguridad (PENDIENTE)
- [ ] PIN de 4 dígitos para acceso manager
- [ ] Saloneros ven solo su propia información
- [ ] Logs de acceso

### 🔲 Fase 5 — Backend real (FUTURO)
- [ ] Supabase o similar si la operación crece
- [ ] Múltiples restaurantes
- [ ] API para integración directa con PoS

---

## 👤 Contexto del negocio

- **Restaurante:** Satori Sushi, Costa Rica (zona turística)
- **Equipo de salón:** rotación alta, saloneros nuevos frecuentes
- **PoS:** genera XLS BIFF8 con reporte de ventas por salonero
- **Moneda:** Colones costarricenses (₡)
- **Impuestos:** IVA 13% + Cargo de servicio 10% (solo en salón)
- **Cajeros:** "Cajero Turno Mañana" (delivery) y "cajero turno tarde" (salón + delivery)

---

## 🤝 Desarrollo

Construido en sesiones de trabajo con **Claude Sonnet** (Anthropic).  
Para retomar el desarrollo: compartir este README + link del repositorio al inicio de la conversación.

**Última actualización:** Marzo 2026
