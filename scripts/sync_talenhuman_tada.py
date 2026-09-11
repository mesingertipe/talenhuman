import os
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de TADÁ
TADA_USER = os.environ.get("TADA_USERNAME", "MARIO.ALEJANDRO")
TADA_PASS = os.environ.get("TADA_PASSWORD", "I51TIhxRp55C")
TADA_BASE_URL = "https://servicios.tada.mx/services/api"

# Credenciales de TalenHuman
TALENHUMAN_API_URL = "https://talenhuman.com/api/integration/attendances"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY")

# Parámetros de Extracción
# Si vas a correrlo cada hora, puedes extraer el día actual completo o los últimos X días
DIAS_ATRAS = int(os.environ.get("DIAS_ATRAS", "1"))
TEST_LIMIT = int(os.environ.get("TEST_LIMIT", "0"))

def hacer_peticion(url, data=None, headers=None, method=None):
    """ Función auxiliar para hacer peticiones HTTP sin librerías externas """
    try:
        req = urllib.request.Request(url, method=method)
        
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
                
        # Anti-WAF User Agent
        if not req.has_header('User-Agent') and not req.has_header('User-agent'):
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
        if data is not None:
            ctype = req.get_header('Content-Type', req.get_header('Content-type', ''))
            
            if isinstance(data, (dict, list)):
                if isinstance(data, dict) and ctype.startswith('application/x-www-form-urlencoded'):
                    data = urllib.parse.urlencode(data).encode('utf-8')
                else:
                    data = json.dumps(data).encode('utf-8')
                    if not ctype:
                        req.add_header('Content-Type', 'application/json')
            elif isinstance(data, str):
                data = data.encode('utf-8')
                
        with urllib.request.urlopen(req, data=data, timeout=60) as response:
            res_body = response.read().decode('utf-8')
            return {
                "status_code": response.getcode(),
                "body": json.loads(res_body) if res_body else None,
                "text": res_body
            }
            
    except urllib.error.HTTPError as e:
        error_text = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_text)
        except:
            error_json = None
        return {
            "status_code": e.code,
            "body": error_json,
            "text": error_text
        }
    except Exception as e:
        return {
            "status_code": 500,
            "body": None,
            "text": str(e)
        }

def format_iso(dt_str):
    if not dt_str:
        return None
    # TalenHuman devuelve 2026-09-10T08:01:00
    # Aseguramos que tenga el formato ISO 8601 que TADA requiere
    return str(dt_str).strip().replace(" ", "T")

def main(event, context):
    print("🚀 INICIANDO ETL: TalenHuman -> TADÁ (Solo Marcaciones de Asistencia)")
    
    try:
        if not TALENHUMAN_API_KEY:
            raise Exception("TALENHUMAN_API_KEY no configurado")

        # 1. Autenticación en TADÁ
        print("1. Autenticando en TADÁ...")
        res_auth = hacer_peticion(
            f"{TADA_BASE_URL}/Auth/Authenticate", 
            data={"username": TADA_USER, "password": TADA_PASS},
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )
                                 
        if res_auth["status_code"] != 200:
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo Auth TADÁ: {res_auth['text']}"}}
            
        token_tada = res_auth["body"].get("token")
        
        # 1.1 Obtener Clientes (GUID) de TADÁ
        res_clientes = hacer_peticion(
            f"{TADA_BASE_URL}/Checadas/Clientes",
            headers={"Authorization": f"Bearer {token_tada}", "Accept": "application/json"}
        )
        
        if res_clientes["status_code"] != 200 or not res_clientes["body"].get("isSuccess"):
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo Clientes TADÁ: {res_clientes['text']}"}}
            
        clientes_tada = res_clientes["body"].get("result", [])
        if not clientes_tada:
             return {"statusCode": 500, "body": {"status": "error", "message": "El usuario de TADÁ no tiene clientes configurados."}}
             
        clave_cliente = clientes_tada[0].get("clave")
        print(f"✅ TADÁ autenticado. Cliente seleccionado: {clientes_tada[0].get('nombreCliente')}")

        # 2. Extracción de Marcaciones de TalenHuman
        ahora = datetime.utcnow() - timedelta(hours=5) # Hora Colombia/México aprox
        fecha_fin = ahora.strftime("%Y-%m-%d")
        fecha_ini = (ahora - timedelta(days=DIAS_ATRAS)).strftime("%Y-%m-%d")
        
        print(f"2. Descargando marcaciones procesadas de TalenHuman ({fecha_ini} a {fecha_fin})...")
        
        url_th = f"{TALENHUMAN_API_URL}?startDate={fecha_ini}&endDate={fecha_fin}"
        res_th = hacer_peticion(
            url_th,
            headers={"X-Api-Key": TALENHUMAN_API_KEY, "Accept": "application/json"},
            method="GET"
        )
                               
        if res_th["status_code"] != 200:
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo GetAttendances TH: {res_th['text']}"}}
            
        th_attendances = res_th["body"]
        if not isinstance(th_attendances, list):
            th_attendances = []
            
        print(f"📥 Se obtuvieron {len(th_attendances)} registros consolidados de TalenHuman.")
        
        if TEST_LIMIT > 0:
            th_attendances = th_attendances[:TEST_LIMIT]
            print(f"🛠️ MODO PRUEBA ACTIVO: Solo se procesarán {TEST_LIMIT} registros.")

        # 3. Transformación al formato de TADÁ
        payload_tada = []
        for att in th_attendances:
            empleado = att.get("employee", {})
            tienda = att.get("store", {})
            emp_id = empleado.get("identificationNumber")
            
            if not emp_id:
                continue
                
            ubicacion = tienda.get("name", "")

            # 3.1 ENTRADA (E)
            clock_in = att.get("clockIn")
            if clock_in:
                payload_tada.append({
                    "claveCliente": clave_cliente,
                    "claveEmpleado": str(emp_id),
                    "claveTipoChecada": "E",
                    "fechaHora": format_iso(clock_in),
                    "ubicacion": ubicacion,
                    "observaciones": att.get("statusObservation")
                })
                
            # 3.2 SALIDA (S)
            clock_out = att.get("clockOut")
            if clock_out:
                payload_tada.append({
                    "claveCliente": clave_cliente,
                    "claveEmpleado": str(emp_id),
                    "claveTipoChecada": "S",
                    "fechaHora": format_iso(clock_out),
                    "ubicacion": ubicacion,
                    "observaciones": att.get("statusObservation")
                })

        # 4. Envío por lotes a TADÁ (Límite 500)
        total_a_enviar = len(payload_tada)
        print(f"3. Enviando {total_a_enviar} marcaciones transformadas (E/S) a TADÁ...")
        
        lote_size = 500
        exitosos = 0
        fallidos = 0
        
        for i in range(0, total_a_enviar, lote_size):
            lote = payload_tada[i:i + lote_size]
            
            res_envio = hacer_peticion(
                f"{TADA_BASE_URL}/Checadas/Registrar",
                data=lote,
                headers={"Authorization": f"Bearer {token_tada}", "Content-Type": "application/json"}
            )
            
            if res_envio["status_code"] in [200, 201] and res_envio["body"] and res_envio["body"].get("isSuccess"):
                # Analizamos el result individual (por si hubo duplicadas o errores individuales)
                resultados = res_envio["body"].get("result", [])
                lote_exitos = sum(1 for r in resultados if r.get("estatus") in ["Aceptada", "Duplicada"])
                exitosos += lote_exitos
                fallidos += (len(lote) - lote_exitos)
                print(f"✅ Lote {i//lote_size + 1} procesado: {lote_exitos} correctas/duplicadas.")
            else:
                print(f"❌ Fallo Lote {i//lote_size + 1}: {res_envio['text']}")
                fallidos += len(lote)
                
        resultado_final = f"Proceso completado. Aceptadas: {exitosos}, Fallidas/Rechazadas: {fallidos}."
        print(f"🏁 {resultado_final}")
        
        return {"statusCode": 200, "body": {"status": "success", "message": resultado_final}}

    except Exception as e:
        print(f"💥 ERROR CRÍTICO: {str(e)}")
        return {"statusCode": 500, "body": {"status": "error", "message": str(e)}}

if __name__ == "__main__":
    main({}, {})
