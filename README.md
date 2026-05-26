# 里 Satori Dashboard

Dashboard de métricas de desempeño para el restaurante Satori (Costa Rica).  
Construido como aplicación web HTML puro + Google Sheets como backend.

---

## 🔗 Links del proyecto

| Recurso | URL |
|---|---|
| App en producción | https://cachosatori.github.io/satori-dashboard/ |
| Repositorio GitHub | https://github.com/CachoSatori/satori-dashboard |
| Apps Script URL | `https://script.google.com/macros/s/AKfycbz_MPh6TFtM6ToY_2CbbdHvtyKCwGg5uFPzYpw-9vcTtmtXX5BDIpnqE3KJgKtZwFBkeg/exec` |

> Mismo Apps Script y Google Sheet que Satori Caja y Satori Propinas.  
> Google Sheets ID: `1DP-gmuNO__QQbl0_2eBDIiLGz9ovvSVhQ5uaAuIqlm0`

---

## 📁 Archivos del proyecto

```
satori-dashboard/
├── index.html               ← App completa (frontend + parser XLS)
├── satori_apps_script.js    ← Backend Google Apps Script (referencia)
└── README.md                ← Este archivo
```

---

## 🏗 Arquitectura

```
XLS del POS (BIFF8/OLE2)
        ↓
  Manager sube desde cualquier dispositivo
        ↓
  Parser JS nativo en el browser (sin librerías externas)
        ↓
  Google Sheets (backend central vía Apps Script v4.1)
        ↓
  Cualquier dispositivo sincroniza y renderiza
```

**Stack:**
- **Frontend:** HTML/CSS/JS puro — sin frameworks ni dependencias
- **Backend:** Google Apps Script (Web App) sobre Google Sheets
- **Hosting:** GitHub Pages
- **Persistencia:** Google Sheets como fuente de verdad + `localStorage` como caché offline

---

## 🔐 Roles y acceso

| Rol | PIN | Descripción |
|---|---|---|
| **Owner** | `3194` | Acceso completo — todas las pestañas + Admin |
| **Manager** | `1959` | Operaciones + Equipo (sin Admin) |
| **G.General** | `1234` | Solo módulo Finanzas |
| **Salonero / Empleado** | Sin PIN | Selecciona su nombre — ve solo sus propias métricas |

Los PINs están hardcodeados en `index.html`. Para cambiarlos: editar `OWNER_PIN`, `MANAGER_PIN` o `CONTADOR_PIN` en el código fuente y hacer commit.

---

## 📊 Pestañas por rol

### Owner — Operaciones
| Pestaña | Descripción |
|---|---|
| **Hoy** | KPIs del último día: ventas totales restaurante (salón + cajeros + delivery), PAX, Prom/PAX, ratio C/B, Beb/PAX, ranking del día |
| **Equipo** | Ranking de saloneros del día con KPIs individuales y detalle de productos |
| **Cajeros** | Ventas por cajero/canal de delivery con filtro de fechas y desglose por período |
| **Calendario** | Promedios por día de semana, gráfico de evolución diaria, tabla cronológica con columnas RESTAURANTE · SALÓN · PAX · PROM/PAX |
| **Cargar XLS** | Upload de reportes diarios del POS, calendario visual de días cargados, backend config, backup/restauración JSON |

### Owner — Finanzas
| Pestaña | Descripción |
|---|---|
| **Ventas** | Tabla contable por período: Venta Bruta · IVA · Servicio · Venta Neta · Salón · Delivery · PAX · Prom/PAX. Exportar CSV |
| **Análisis** | Comparativa mensual año vs año + vista por año individual. Incluye margen del contador si está configurado |
| **Histórico** | KPIs acumulados con filtro libre de fechas, gráfico de evolución Prom/PAX, Top 5 productos del período |
| **Mix Ventas** | Desglose por producto/categoría. Modos: ver período único o comparar hasta 6 períodos. Exportar CSV |
| **Metas** | Meta mensual restaurante, % margen contador, metas globales de performance (Prom/PAX, Beb/PAX, Ratio C/B, etc.), overrides individuales por salonero |
| **Propinas** | Resumen gerencial: ICP por salonero, ranking, Q1 vs Q2, tendencia semanal, histórico mensual. **Sección Cocina:** pool semanal dividido en partes iguales (excl. Selena) |

### Owner — Equipo
| Pestaña | Descripción |
|---|---|
| **Competencias** | Crear y gestionar competencias entre saloneros (productos, puntos, participantes, premio) |
| **Gestión equipo** | Performance individual por período: consistencia, tendencia, racha, KPIs vs metas |

### Owner — Admin
| Pestaña | Descripción |
|---|---|
| **Empleados** | Alta/baja/edición de empleados en Google Sheets (compartido con Caja y Propinas) |
| **Config** | PINs actuales, URL del backend, lista de productos para clasificación, ventas anuales de referencia |

### Manager — Operaciones + Equipo
Hoy · Ventas · Histórico · Mix Ventas · Análisis · Cargar XLS · Equipo · Gestión equipo · Competencias · Propinas

### G.General — Finanzas
Ventas · Análisis · Histórico · Mix Ventas · Metas · Propinas · Cajeros

### Empleado (dinámico según datos)
| Pestaña | Condición |
|---|---|
| **Mi día** | Si el nombre aparece en los XLS cargados |
| **Mi semana** | Si el nombre aparece en los XLS cargados |
| **Mi historial** | Si el nombre aparece en los XLS cargados |
| **Competencias** | Si participa en alguna competencia activa |
| **Mis propinas** | Siempre visible |

---

## 📐 Métricas clave

### Definiciones

| Métrica | Fórmula | Notas |
|---|---|---|
| **Ventas Salón** (`total`) | Suma de ventas de saloneros (sin cajero) | Base de todos los KPIs de salón |
| **Cajeros / Delivery** (`cajTotal`) | Suma de ventas con `esCajero = true` | |
| **Restaurante** (`totalRest`) | `total + cajTotal` | Ventas netas sin IVA ni servicio |
| **PAX** | Fila `COMENSALES` del XLS | Solo salón — delivery no registra PAX |
| **Prom/PAX** | `ventas_salón / PAX_salón` | **Delivery nunca entra en numerador ni denominador** |
| **Beb/PAX** | `unidades_bebidas / PAX` | Ideal ≥ 1.2 |
| **Ratio C/B (₡)** | `ventas_comidas / ventas_bebidas` | Ideal 2.5–4.5 |
| **ICP** | `propina_generada / ventas_totales × 100` | Índice de Conversión de Propina. ≥13% excelente · 10–13% bueno · <10% a mejorar |

### Columnas del XLS del POS
| Col | Nombre | Uso |
|---|---|---|
| A | Salonero | Nombre del salonero/cajero |
| B | Producto | Nombre del producto o "COMENSALES" |
| C | Cantidad | Cantidad / PAX |
| D | MontoTotal | Monto bruto |
| E | IVA | 13% |
| F | Servicio | 10% — 0 = delivery, >0 = salón |
| I | ComidasMesero | Cantidad de platos |
| J | BebidasMesero | Cantidad de bebidas |
| L | VentasBebidas | Ventas bebidas (con impuestos) |
| M | VentasComidas | Ventas comidas (con impuestos) |
| O | VentasTotales | Bruto → neto = O − E − F |

---

## 🍳 Sección Cocina en Propinas gerencial

En la pestaña **Propinas** (vista Owner/Manager/G.General) aparece al final una sección separada para cocina:

- Agrupa todos los tips de cocina por semana (`num_semana` del turno)
- Divide el pool semanal **en partes iguales** entre los trabajadores de cocina que participaron esa semana
- **Selena** (jefa de cocina) está excluida como receptora — su parte vuelve al pool
- Muestra: tabla por semana, tabla por trabajador (mes actual) e histórico mensual

---

## 🗄 Estructura Google Sheets

| Hoja | Contenido |
|---|---|
| `dias` | Datos parseados de los XLS diarios (JSON por fecha) |
| `empleados` | Padrón de empleados (compartido con Caja y Propinas) |
| `productos` | Catálogo de productos para clasificación bebidas/comidas |
| `comps` | Competencias activas e históricas |
| `metas` | Metas del restaurante y saloneros |
| `propinas_turnos` | Turnos de propinas registrados |
| `movimientos` | Movimientos de caja |
| `proveedores_caja` | Lista de proveedores |
| `turnos` | Cierres de turno de caja |

---

## 🚀 Setup en nuevo dispositivo

1. Abrir `https://cachosatori.github.io/satori-dashboard/`
2. La app sincroniza automáticamente desde Google Sheets
3. No requiere configuración adicional

---

## 🔄 Flujo para subir XLS diario

1. Entrar como **Manager** u **Owner**
2. Pestaña **Cargar XLS**
3. Arrastrar uno o varios archivos `.xls / .xlsx`
4. El parser detecta la fecha desde el nombre del archivo
5. Los datos se guardan en `localStorage` + Google Sheets simultáneamente

---

## 🔧 Actualizar el Apps Script

1. Copiar el contenido de `satori_apps_script_v4.1.js` (carpeta SATORI PROPINAS)
2. Ir a [script.google.com](https://script.google.com) → proyecto Satori
3. `Ctrl+A` → pegar → `Ctrl+S`
4. **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**
5. La URL no cambia — las apps siguen funcionando sin modificaciones

---

## 🗺 Relacionado

- [satori-caja](https://github.com/CachoSatori/satori-caja) — Control de caja y pagos a proveedores
- [satori-propinas](https://github.com/CachoSatori/satori-propinas) — Distribución de propinas por turno
