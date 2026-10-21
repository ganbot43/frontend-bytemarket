#!/bin/bash
#
# Comprueba la matriz de permisos contra el sistema CORRIENDO.
#
#   docker compose up -d
#   ./scripts/verificar-permisos.sh
#
# Para qué sirve, y por qué no basta con los tests de los servicios: cada
# servicio prueba su propio portero por dentro, con la matriz simulada. Esto
# recorre el camino entero —navegador, gateway, servicio, matriz real en
# MySQL— con los cuatro puestos, que es donde aparecen los fallos que ninguna
# prueba unitaria ve: una ruta que el gateway no enruta, un módulo que no
# concede lo que dice conceder, una sesión que no trae el rol que debería.
#
# Cómo lee los resultados:
#
#   403            = denegado.
#   cualquier otro = la autorización dejó pasar y el controlador ya decide.
#                    Un 400 o un 409 aquí son correctos: el cuerpo va vacío
#                    a propósito, porque lo que se comprueba es la puerta y
#                    no el formulario.
#   502/503/504    = el gateway no pudo enrutar. NO es una respuesta de
#                    autorización: se reintenta y, si persiste, cuenta como
#                    error del verificador y no como permiso concedido.
#
# Variables: GATEWAY (por defecto http://localhost:8085) y las contraseñas de
# los usuarios sembrados, si se cambiaron.

set -u

G=${GATEWAY:-http://localhost:8085}
CAJERO_USER=${CAJERO_USER:-cajero@bytemarket.com}; CAJERO_PASS=${CAJERO_PASS:-cajero123}
JEFE_USER=${JEFE_USER:-jefe@bytemarket.com};       JEFE_PASS=${JEFE_PASS:-jefe123}
ENCARG_USER=${ENCARG_USER:-admin@bytemarket.com};  ENCARG_PASS=${ENCARG_PASS:-admin123}
GERENTE_USER=${GERENTE_USER:-owner@bytemarket.com};GERENTE_PASS=${GERENTE_PASS:-admin123}

ok=0; mal=0; err=0

tok() {
  curl -s -X POST "$G/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))' 2>/dev/null
}

T_CAJERO=$(tok "$CAJERO_USER" "$CAJERO_PASS")
T_JEFE=$(tok "$JEFE_USER" "$JEFE_PASS")
T_ENCARG=$(tok "$ENCARG_USER" "$ENCARG_PASS")
T_GERENTE=$(tok "$GERENTE_USER" "$GERENTE_PASS")

for n in CAJERO JEFE ENCARG GERENTE; do
  eval "v=\${T_$n}"
  if [ -z "$v" ]; then
    echo "!! No se pudo iniciar sesión como $n. ¿Está el sistema levantado en $G?"
    exit 99
  fi
done

# Sin arrays asociativos a propósito: macOS trae bash 3.2 y ahí TOK[cajero] y
# TOK[gerente] caen en el MISMO índice. La primera versión de este script los
# usaba y todas las llamadas salían con el último token: decía que todo estaba
# bien porque todo lo hacía el gerente. Esta comprobación es el recordatorio.
if [ "$T_CAJERO" = "$T_GERENTE" ]; then
  echo "!! Los tokens de dos puestos distintos son iguales: el verificador no sirve así."
  exit 99
fi

codigo() { # metodo ruta token
  if [ "$1" = "GET" ]; then
    curl -s -o /dev/null -w '%{http_code}' "$G$2" -H "Authorization: Bearer $3"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$1" "$G$2" -H "Authorization: Bearer $3" \
      -H 'Content-Type: application/json' -d '{}'
  fi
}

espera() { # PUESTO SI|NO metodo ruta
  eval "t=\${T_$1}"
  local c i
  for i in 1 2 3 4 5; do
    c=$(codigo "$3" "$4" "$t")
    case "$c" in 502|503|504) sleep 4 ;; *) break ;; esac
  done
  case "$c" in
    502|503|504)
      err=$((err+1)); printf "    ERR  %-4s %-38s el gateway no enrutó (HTTP %s)\n" "$3" "$4" "$c"; return ;;
  esac
  local real; [ "$c" = "403" ] && real=NO || real=SI
  if [ "$real" = "$2" ]; then
    ok=$((ok+1)); printf "    ok   %-4s %-38s (%s)\n" "$3" "$4" "$c"
  else
    mal=$((mal+1)); printf "    MAL  %-4s %-38s esperaba %s, dio %s (HTTP %s)\n" "$3" "$4" "$2" "$real" "$c"
  fi
}

echo "Verificando permisos contra $G"
echo
echo "── CAJERO: vender en el mostrador ──────────────────────────"
espera CAJERO SI GET  /api/admin/caja/sesion
espera CAJERO SI POST /api/admin/caja/abrir
espera CAJERO SI GET  /api/admin/products
espera CAJERO SI GET  /api/admin/orders/sale-options
espera CAJERO SI POST /api/admin/orders
espera CAJERO SI POST /api/admin/caja/cerrar
echo "   y lo que NO es suyo —quien vende no cuenta su propio cajón:"
espera CAJERO NO GET  /api/admin/orders
espera CAJERO NO PUT  /api/admin/orders/1/status
espera CAJERO NO POST /api/admin/caja/asignar-fondo
espera CAJERO NO POST /api/admin/caja/1/arqueo
espera CAJERO NO POST /api/admin/caja/1/cuadrar
espera CAJERO NO GET  /api/admin/caja/sesiones
espera CAJERO NO GET  /api/admin/inventory/movements
espera CAJERO NO POST /api/admin/products
espera CAJERO NO GET  /api/admin/reports/dashboard
espera CAJERO NO GET  /api/admin/users
espera CAJERO NO GET  /api/admin/permissions
espera CAJERO NO GET  /api/admin/panel-roles
espera CAJERO NO POST /api/admin/panel-roles
espera CAJERO NO GET  /api/admin/reclamaciones

echo
echo "── JEFE DE VENTAS: fondo, arqueo, cuadre y su gente ────────"
espera JEFE SI POST /api/admin/caja/asignar-fondo
espera JEFE SI POST /api/admin/caja/1/arqueo
espera JEFE SI POST /api/admin/caja/1/cuadrar
espera JEFE SI GET  /api/admin/caja/sesiones
espera JEFE SI GET  /api/admin/orders
espera JEFE SI GET  /api/admin/inventory/movements
espera JEFE SI GET  /api/admin/reports/dashboard
espera JEFE SI GET  /api/admin/users
espera JEFE SI POST /api/admin/users
echo "   y lo que NO es suyo —consulta el inventario pero no lo mueve:"
espera JEFE NO PUT  /api/admin/orders/1/status
espera JEFE NO POST /api/admin/inventory/movements
espera JEFE NO POST /api/admin/products
espera JEFE NO GET  /api/admin/permissions
espera JEFE NO GET  /api/admin/reclamaciones
espera JEFE NO GET  /api/admin/business-config

echo
echo "── ENCARGADO: gestión de la tienda ─────────────────────────"
espera ENCARG SI POST /api/admin/products
espera ENCARG SI POST /api/admin/inventory/movements
espera ENCARG SI PUT  /api/admin/orders/1/status
espera ENCARG SI GET  /api/admin/reclamaciones
espera ENCARG SI POST /api/admin/categories
espera ENCARG SI GET  /api/admin/permissions
espera ENCARG SI GET  /api/admin/panel-roles
echo "   y lo que es solo del gerente:"
espera ENCARG NO GET  /api/admin/business-config
espera ENCARG NO PUT  /api/admin/business-config
espera ENCARG NO GET  /api/admin/payment-methods

echo
echo "── GERENTE: todo, siempre ──────────────────────────────────"
espera GERENTE SI GET  /api/admin/business-config
espera GERENTE SI PUT  /api/admin/business-config
espera GERENTE SI GET  /api/admin/payment-methods
espera GERENTE SI GET  /api/admin/permissions
espera GERENTE SI GET  /api/admin/panel-roles
espera GERENTE SI POST /api/admin/products
espera GERENTE SI POST /api/admin/caja/1/cuadrar
espera GERENTE SI GET  /api/admin/reclamaciones

echo
echo "════ $ok correctos · $mal incorrectos · $err sin respuesta ════"
exit $((mal + err))
