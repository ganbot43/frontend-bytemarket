# Módulo de Cajas: fondos, apertura, ventas, arqueo, cierre y cuadre

> Especificación funcional para implementar. Stack: **completar según el proyecto** (frontend, backend, BD, impresión de tickets).

## 1. Roles y permisos

| Rol | Puede |
|---|---|
| **Jefe de ventas** (o gerente / subgerente en su ausencia) | Asignar fondo, habilitar cajero, ver cajas en tiempo real, hacer arqueo sorpresivo, cuadrar e imprimir papel de caja |
| **Cajero** | Abrir caja (si está habilitado), vender, cerrar su caja, imprimir su cierre |

- Gerente y subgerente tienen los mismos permisos del jefe de ventas (suplencia).
- Un cajero solo ve y opera **su propia caja**.
- Solo puede haber **una caja abierta por cajero** a la vez.

## 2. Estados de la caja

```
FONDO_ASIGNADO → HABILITADA → ABIERTA → CERRADA → CUADRADA
```

| Estado | Descripción |
|---|---|
| `FONDO_ASIGNADO` | El jefe registró el fondo para el cajero |
| `HABILITADA` | El cajero ya puede abrir caja |
| `ABIERTA` | Turno en curso, admite ventas y arqueos |
| `CERRADA` | El cajero cerró; no admite más ventas |
| `CUADRADA` | El jefe validó efectivo y vouchers y firmó el papel de caja |

Reglas: no se puede vender si la caja no está `ABIERTA`; no se puede cuadrar si no está `CERRADA`; una caja `CUADRADA` es inmutable.

## 3. Flujo completo

### 3.1 Asignación de fondos (Jefe de ventas)
1. Entra al sistema y selecciona un cajero.
2. Registra el **fondo inicial** (ej. S/ 300).
3. **Habilita** al cajero para abrir caja.
4. Se guarda quién asignó, cuándo y el monto.

### 3.2 Apertura de caja (Cajero)
1. Inicia sesión con su cuenta → módulo **Cajas**.
2. Si está habilitado, ve la opción **Apertura de caja** con el fondo ya cargado (solo lectura).
3. Confirma la apertura (se registra fondo, fecha y hora).
4. Se imprime el **ticket de apertura** con: nombre del cajero, DNI, fondo, fecha/hora y **línea de firma**. El cajero lo firma.
5. La caja pasa a `ABIERTA`.

### 3.3 Zona de venta (Cajero)
Medios de pago: **Efectivo**, **Niubiz (tarjeta)** y **QR**.

| Medio | Comprobantes que se imprimen |
|---|---|
| **Efectivo** | Solo **boleta de venta** para el cliente (el efectivo es el comprobante del cajero) |
| **Niubiz (tarjeta)** | 1) **Voucher de comercio** (queda para el cajero) 2) **Boleta de venta** (cliente) |
| **QR** | 1) **Voucher de comercio** (queda para el cajero) 2) **Boleta de venta** (cliente) |

- Cada venta queda asociada a la caja abierta, con su medio de pago y total.
- Para tarjeta/QR se guarda la referencia del voucher (nro. de operación) para poder contrastar luego.

### 3.4 Arqueo sorpresivo (Jefe de ventas)
- Puede hacerse **en cualquier momento** mientras la caja esté `ABIERTA`.
- El jefe ve en su pantalla, en tiempo real, por cajero:
  - Fondo inicial
  - Total de ventas en **efectivo** y cantidad
  - Total de ventas **Niubiz (tarjeta + QR)** y cantidad
  - **Efectivo esperado** = fondo + ventas en efectivo
- El jefe cuenta el efectivo físico, lo registra y el sistema calcula la diferencia al instante.
- Se guarda el arqueo (quién, cuándo, esperado, contado, diferencia, observación). **No cierra la caja.**

### 3.5 Cierre de caja (Cajero)
1. Al terminar el turno: **Operaciones → Cerrar caja**.
2. La caja pasa a `CERRADA` y ya no admite ventas.
3. Se imprime la **boleta de cierre** con:
   - Solo las ventas **Niubiz** (tarjeta y QR) y su historial.
   - **No** incluye el detalle de efectivo.

### 3.6 Cuadre (Cajero + Jefe de ventas)
El cajero se acerca al jefe de ventas y se verifica:

**Efectivo**
```
Efectivo esperado = Fondo inicial + Ventas en efectivo
Ejemplo: 300 + 1,200 = S/ 1,500
Diferencia = Efectivo contado − Efectivo esperado
```
El monto debe coincidir con lo que entrega el cajero y con lo que muestra la pantalla del jefe.

**Niubiz (tarjeta y QR)**
- La cantidad de vouchers físicos debe coincidir con las ventas del sistema (ej. 15 ventas Niubiz → 15 vouchers).
- Se comparan también los montos.

| Diferencia efectivo | Resultado |
|---|---|
| = 0 | Cuadrada |
| > 0 | Sobrante |
| < 0 | Faltante |

Si hay diferencia (efectivo o vouchers) se exige **observación** del jefe antes de cuadrar.

### 3.6.1 Papel de caja
Si todo cuadra, el jefe de ventas **imprime el papel de caja** con: cajero, DNI, fondo, ventas por medio de pago, efectivo esperado, contado, diferencia, cantidad de vouchers Niubiz, observaciones y **firma** del cajero y del jefe. La caja pasa a `CUADRADA`.

## 4. Diagrama

```
Jefe asigna fondo + habilita
        ↓
Cajero abre caja → ticket apertura (nombre, DNI, firma)
        ↓
Ventas (efectivo / Niubiz / QR) → voucher + boleta
        ↓              ↑
        └── Arqueo sorpresivo (jefe, cualquier momento)
        ↓
Cajero cierra caja → boleta de cierre (solo Niubiz + historial)
        ↓
Cuadre con jefe: efectivo (fondo + ventas) y vouchers Niubiz
        ↓
Jefe imprime papel de caja → cajero firma → CUADRADA
```

## 5. Modelo de datos sugerido

- **caja_sesion**: id, cajero_id, fondo_inicial, estado, asignado_por, habilitada_at, abierta_at, cerrada_at, cuadrada_at, cuadrada_por, efectivo_contado, diferencia, observacion
- **venta**: id, caja_sesion_id, total, medio_pago (`EFECTIVO` | `TARJETA` | `QR`), nro_operacion_voucher (nullable), boleta_serie, boleta_numero, created_at
- **arqueo**: id, caja_sesion_id, realizado_por, efectivo_esperado, efectivo_contado, diferencia, observacion, created_at
- **caja_movimiento / historial**: id, caja_sesion_id, tipo, usuario_id, detalle, created_at (auditoría de cada acción)

## 6. Endpoints sugeridos

| Método | Ruta | Rol | Acción |
|---|---|---|---|
| POST | `/cajas/asignar-fondo` | Jefe | Asigna fondo y habilita al cajero |
| GET | `/cajas/mi-caja` | Cajero | Estado de su caja y fondo asignado |
| POST | `/cajas/abrir` | Cajero | Abre caja e imprime ticket de apertura |
| POST | `/ventas` | Cajero | Registra venta (efectivo/tarjeta/QR) |
| GET | `/cajas/activas` | Jefe | Cajas abiertas con totales en tiempo real |
| POST | `/cajas/{id}/arqueo` | Jefe | Registra arqueo sorpresivo |
| POST | `/cajas/{id}/cerrar` | Cajero | Cierra caja e imprime boleta de cierre |
| GET | `/cajas/{id}/cuadre` | Jefe | Datos para cuadrar (esperado, vouchers) |
| POST | `/cajas/{id}/cuadrar` | Jefe | Cuadra, guarda observación e imprime papel de caja |

## 7. Pantallas

1. **Jefe de ventas – Asignar fondos:** lista de cajeros, monto, botón Habilitar.
2. **Jefe de ventas – Cajas activas / Arqueo:** tarjetas por cajero con fondo, ventas efectivo, ventas Niubiz, efectivo esperado, botón Arqueo.
3. **Jefe de ventas – Cuadre:** esperado vs contado, conteo de vouchers, observación, botón Imprimir papel de caja.
4. **Cajero – Módulo Cajas:** botón Apertura (si está habilitado), fondo visible.
5. **Cajero – Zona de venta:** carrito, selector de medio de pago, impresión de comprobantes.
6. **Cajero – Operaciones:** Cerrar caja e imprimir cierre.

## 8. Comprobantes a imprimir

| Documento | Cuándo | Contenido clave |
|---|---|---|
| Ticket de apertura | Al abrir caja | Nombre, DNI, fondo, fecha/hora, firma |
| Voucher de comercio | Venta con tarjeta/QR | Comprobante del cajero |
| Boleta de venta | Toda venta | Comprobante del cliente |
| Boleta de cierre | Al cerrar caja | Solo ventas Niubiz + historial |
| Papel de caja | Tras el cuadre | Resumen completo, diferencias, firmas |

## 9. Reglas de negocio y validaciones

- No se vende con caja que no esté `ABIERTA`.
- No hay dos cajas abiertas para el mismo cajero.
- El cajero no puede modificar el fondo asignado.
- El arqueo no cambia el estado de la caja.
- El cuadre solo se hace con la caja `CERRADA`.
- Si hay diferencia en efectivo o vouchers, la observación es obligatoria.
- Toda acción (asignar, abrir, vender, arquear, cerrar, cuadrar) se audita con usuario y fecha/hora.
- Una caja `CUADRADA` no se puede editar ni reabrir.

## 10. Alcance de la tarea para Claude Code

1. Revisar la estructura actual del proyecto y respetar su stack y convenciones.
2. Crear migraciones/tablas del punto 5.
3. Implementar los endpoints del punto 6 con control de roles.
4. Implementar las pantallas del punto 7.
5. Implementar la impresión de los comprobantes del punto 8 (formato ticket térmico).
6. Entregar archivos completos, no fragmentos.
