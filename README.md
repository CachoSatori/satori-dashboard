# 里 Satori Dashboard · Saloneros

Dashboard de métricas de desempeño para el restaurante Satori (Costa Rica).  
Construido como aplicación web HTML puro + Google Sheets como backend.

---

## 🔗 Links del proyecto

| Recurso | URL |
|---|---|
| Dashboard en producción | https://cachosatori.github.io/satori-dashboard/ |
| Repositorio GitHub | https://github.com/CachoSatori/satori-dashboard |
| Apps Script URL | `https://script.google.com/macros/s/AKfycbz_MPh6TFtM6ToY_2CbbdHvtyKCwGg5uFPzYpw-9vcTtmtXX5BDIpnqE3KJgKtZwFBkeg/exec` |

---

## 📁 Archivos del proyecto

```
satori-dashboard/
├── index.html               ← Dashboard completo (frontend + parser XLS)
├── satori_apps_script.js    ← Backend Google Apps Script
└── README.md                ← Este archivo
```

---

## 🏗 Arquitectura

```
XLS del PoS (BIFF8/OLE2)
        ↓
  Manager sube desde cualquier dispositivo
        ↓
  Parser JS nativo en el browser (sin librerías externas)
        ↓
  Google Sheets (backend central vía Apps Script)
        ↓
  Cualquier dispositivo sincroniza y renderiza
```

**Stack:**
- **Frontend:** HTML/CSS/JS puro — sin frameworks ni dependencias externas
- **Backend:** Google Apps Script (Web App) sobre Google Sheets
- **Hosting:** GitHub Pages (gratuito)
- **Persistencia:** Google Sheets como fuente de verdad + localStorage como cache offline

---

## 🔐 Sistema de acceso

| Rol | Acceso | PIN |
|---|---|---|
| **Owner** | Todo + pestaña Config | `OWNER_PIN` hardcodeado en `index.html` |
| **Manager** | Todo excepto Config | `MANAGER_PIN` hardcodeado en `index.html` |
| **Salonero** | Solo sus propias vistas | Sin PIN — selecciona su nombre |

Para cambiar un PIN: editá `index.html` en GitHub, buscá `OWNER_PIN` o `MANAGER_PIN`, cambiá el valor, hacé commit.

```javascript
const OWNER_PIN   = '****'; // Tu PIN privado
const MANAGER_PIN = '****'; // PIN del manager
```

---

## 📊 Vistas por rol

### Manager / Owner
| Pestaña | Descripción |
|---|---|
| **Resumen** | KPIs del último día: ventas totales restaurante (salón + cajeros + delivery), PAX, Prom/PAX, Prom/Plato, Prom/Bebida, Beb/PAX, ratio C/B. Ranking de saloneros sorteable. |
| **Histórico** | Gráfico de evolución Prom/PAX por salonero + KPIs acumulados del rango seleccionado |
| **Por Salonero** | Cards con todas las métricas individuales + top 5 productos acumulados del período |
| **📅 Por Día** | Tendencias por día de semana: tarjetas, matriz salonero×día, gráfico |
| **🧾 Cajeros** | Ventas Turno Mañana + Turno Tarde con desglose Delivery vs Salón, filtro por rango, totales período, promedio por día de semana |
| **📊 Evaluación** | Metas mensuales (restaurante + individuales), barra de progreso, proyección al cierre, tabla de evaluación con consistencia y tendencia |
| **📂 Subir XLS** | Upload múltiple con detección de fecha por nombre de archivo, calendario visual de días cargados |
| **🏆 Competencias** | Sistema de competencias con puntos por producto, ranking en tiempo real |
| **🔑 Config** | Solo Owner: muestra PINs actuales, configurar URL del backend, enviar reportes mensuales por correo |

### Salonero (acceso personal)
| Pestaña | Descripción |
|---|---|
| **Mi día** | KPIs personales del último día vs promedio general |
| **Mi historial** | Evolución personal con rango de fechas + top 5 productos |
| **📅 Mi semana** | Rendimiento por día de semana + comparativa vs restaurante |
| **🏆 Mis competencias** | Competencias activas y posición personal |

---

## 📐 Métricas implementadas

### Por salonero
- **Ventas totales netas** — sin IVA (13%) ni Servicio (10%)
- **PAX** — comensales atendidos (item PAX del XLS)
- **Prom/PAX** — ticket promedio por comensal
- **Ventas Comidas / Ventas Bebidas** — columnas L/M del XLS
- **iCom / iBeb** — cantidad de platos y bebidas
- **Prom/Plato** — precio promedio por plato
- **Prom/Bebida** — precio promedio por bebida
- **Beb/PAX** — bebidas por comensal (semáforo: 🟢≥1.2 🟡0.8–1.2 🔴<0.8)
- **Ratio C/B en ₡** — colones de comida por cada colón de bebida (ideal 2.5–4.5)
- **Ratio C/B en uds** — platos por cada bebida (ideal 1.5–3.5)
- **Top 5 productos** — acumulado por rango de fechas

### Por cajero
- **Total netas** — delivery + salón
- **Delivery** — ventas sin cargo de servicio (col F = 0)
- **Salón** — ventas con cargo de servicio (col F > 0)
- **Ticket promedio** — por orden
- **% Delivery / % Salón** del total

### Restaurante
- **Ventas Totales Restaurante** = Saloneros + Cajeros
- **% Salón / % Delivery** del total
- **Meta mensual** con barra de progreso y proyección al cierre del mes

### Evaluación de saloneros
- **Consistencia** — % días sobre el promedio general del restaurante
- **Tendencia** — comparación primera vs segunda mitad del período (↗↘→)
- **vs General** — diferencia % vs promedio del restaurante esos mismos días
- **vs Meta individual** — diferencia % vs meta Prom/PAX fijada por el manager

---

## 🗄 Estructura de datos

### Google Sheets — hoja `dias`
| fecha | uploadedAt | data |
|---|---|---|
| 2026-03-13 | 2026-03-13T21:00:00Z | `{"fileName":"...","saloneros":{...}}` |

**Estructura de `data.saloneros`:**
```json
{
  "Dolores": {
    "pax": 20, "total": 238589, "com": 211130, "beb": 82335,
    "iCom": 31, "iBeb": 21, "promPax": 11929, "bebPax": 1.05,
    "ratioCB": 2.56, "ratioU": 1.5, "promPlato": 6811, "promBebida": 3921,
    "prods": [["CRISPY TUNA BITES", 3, 24540], ...]
  },
  "Cajero Turno Tarde": {
    "esCajero": true, "total": 162831,
    "salon": 45000, "delivery": 117831,
    "ordenes": 28, "ticketProm": 5815,
    "prods": [...]
  }
}
```

### Google Sheets — hoja `comps`
Competencias en formato JSON (`[{id, nombre, tipo, inicio, fin, premio, prods:[{name,pts}], parts:[...]}]`)

### Google Sheets — hoja `meta`
Metas y configuración (`{restaurante:{YYYY-MM: number}, saloneros:{name: number}}`)

---

## 🔧 Parser XLS (BIFF8/OLE2)

El parser lee archivos `.xls` nativamente en el browser sin librerías externas.

**Columnas del XLS del PoS:**
| Col | Índice | Nombre | Uso |
|---|---|---|---|
| A | 0 | Salonero | Nombre del salonero/cajero |
| B | 1 | Producto | Nombre del producto o "PAX" |
| C | 2 | Cantidad | Cantidad vendida / PAX |
| D | 3 | MontoTotal | Monto bruto |
| E | 4 | IVA | 13% — se resta del total |
| F | 5 | Servicio | 10% — 0=delivery, >0=salón |
| L | 11 | VentasBebidasMesero | Ventas bebidas (con impuestos) |
| M | 12 | VentasComidasMesero | Ventas comidas (con impuestos) |
| O | 14 | VentasTotalesMesero | Total bruto → neto = O − E − F |
| I | 8 | ComidasMesero | Cantidad de platos |
| J | 9 | BebidasMesero | Cantidad de bebidas |

**Fix MULRK crítico:** Offset corregido `pos+8` → `pos+10` para leer correctamente valores RK.

**Detección de cajeros:** Nombres `"Cajero Turno Mañana"` y `"cajero turno tarde"` (case-insensitive).

---

## 📅 Upload múltiple de XLS

El sistema detecta automáticamente la fecha desde el nombre del archivo:

| Formato del nombre | Fecha detectada |
|---|---|
| `salon 13 03 2026.xls` | 2026-03-13 ✓ |
| `salon_13_03_2026.xls` | 2026-03-13 ✓ |
| `2026-03-13.xls` | 2026-03-13 ✓ |
| `salon 01 03.xls` | No detecta → pregunta |

---

## 🏆 Sistema de competencias

- Productos con puntos configurables por unidad vendida
- Ranking en tiempo real por puntos totales (qty × pts)
- Backfill automático desde XLS ya cargados
- Vista del salonero: posición + unidades + puntos por producto
- Ordenadas automáticamente: **En curso → Próximas → Finalizadas**

---

## 🚀 Setup en nuevo dispositivo

1. Abrí `https://cachosatori.github.io/satori-dashboard/`
2. El dashboard sincroniza automáticamente desde Google Sheets
3. No requiere configuración adicional

---

## 🔄 Flujo para subir XLS

1. Entrá como **Manager** u **Owner**
2. Pestaña **📂 Subir XLS**
3. Arrastrá uno o varios archivos XLS
4. Detección automática de fecha; si no puede, pregunta
5. Los datos se guardan en localStorage + Google Sheets

---

## 📧 Reportes Mensuales por correo

Desde **Config** (solo Owner), tres botones envían reportes a satorisushibar@gmail.com:

| Botón | Acción |
|---|---|
| 📈 Reporte de ventas | Envía el reporte de ventas del mes actual |
| 💰 Reporte de propinas | Envía el reporte de propinas del mes actual |
| 📧 Ambos reportes | Envía ambos en un solo clic |

Los reportes también se envían **automáticamente**:
- **Día 1 de cada mes** → mes anterior completo (trigger `reporteMensualCompleto`)
- **Día 15 de cada mes** → mes en curso hasta esa fecha (trigger `reporteQuincenal`)

Ver documentación completa del sistema de reportes en: `/reporte/README.md`

---

## 🏆 IRS — Índice de Rendimiento del Salonero

Métrica compuesta (0–100) incluida en los reportes mensuales para identificar al mejor empleado del mes:

```
IRS = (Ticket/PAX normalizado × 45%)
    + (Constancia × 35%)
    + (PAX/servicio normalizado × 20%)
```

| Componente | Peso | Descripción |
|---|---|---|
| Ticket/PAX | 45% | Cuánto vende por comensal (normalizado vs el mejor del grupo) |
| Constancia | 35% | % de días trabajados del total de días con ventas en el mes |
| PAX/servicio | 20% | Cuántos comensales atiende por servicio (normalizado) |

---

## 🗺 Roadmap

| Fase | Estado | Descripción |
|---|---|---|
| Fase 1 | ✅ Completo | HTML + localStorage, parser XLS, todas las métricas |
| Fase 2 | ✅ Completo | Google Sheets backend, multi-dispositivo, cajeros, evaluación, metas |
| Fase 3 | 🔲 Pendiente | PWA instalable (manifest.json + Service Worker) |
| Fase 4 | ✅ Completo | PIN Manager + Owner, separación de vistas por rol |
| Fase 5 | 🔲 Futuro | Backend real (Supabase) si la operación crece |

---

## 🐛 Bugs resueltos

| Bug | Solución |
|---|---|
| MULRK offset incorrecto | pos+8 → pos+10 |
| Fechas corruptas en Sheets | `@STRING@` format + normalización YYYY-MM-DD |
| PAX float (0.03) | Math.round() + sanitización |
| Seed 09/03/2025 apareciendo siempre | Eliminado en v3 + wipe localStorage |
| VentasTotalesMesero incluye impuestos | Total neto = O − E − F |
| Duplicados al re-subir | Normalización de claves fecha |
| PIN manager no sincronizaba entre dispositivos | PIN hardcodeado en código (MANAGER_PIN) |
| Filtros de fecha no aplicaban en Safari | Polling 300ms + change/input/blur events |
| Uds incorrectas en ranking competencias | Usar `_units` separado de `_total` en ranking |
| Datos demo 09/03 aparecían tras reload | DB_VERSION bump a v3 + wipe localStorage |
| Reporte: Mix C/B mostraba ₡ en vez de ítems | `iCom`/`iBeb` son cantidades, no montos — formato corregido |
| Reporte: Tendencia semanal sin días ni promedio | Agregar `dias` y `avg` por semana en `_calcVentas` |
| Reporte: Promedio por día ×12 veces | `diaMap` usaba totales por salonero → corregido a totales por día |
| Reporte: Delivery sumado doble en Caja | `ventCaj = total - delivery`, no `total` completo del cajero |

---

## 👥 Saloneros

Lista dinámica — se construye automáticamente desde los XLS cargados.  
Conocidos: `Dolores`, `Rocio`, `Jaime`, `Melani`, `Nacho`, `Jota`, `Joaquina`, `Maxi`, `ROSAURA M`

---

## 📋 Historial de versiones del Apps Script

| Versión | Cambio |
|---|---|
| v1 | Apps Script inicial |
| v2 | Fix param handling GET/POST |
| v3 | Fix fecha como Date object + @STRING@ format |
| v4 | Fix saveDia con normalización de fecha |
| v5 | getMetas/saveMetas + cajeros + saveMetas via GET fallback |
| v6 | saveMetas en GET handler para compatibilidad total |
| v4.1 (propinas) | Reportes por correo, IRS, top productos por tipo, fix delivery vs caja, mes actual vs anterior, trigger quincenal *(versión actual)* |
