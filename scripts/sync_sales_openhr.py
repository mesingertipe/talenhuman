import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta
import time
import os
import re

def main(args):
    print("🚀 INICIANDO ETL DE VENTAS PARA TALENHUMAN (Sin Dependencias Externas)")
    
    # 1. CONFIGURACIÓN Y PARÁMETROS
    dias_a_repasar = int(os.environ.get("DIAS_REPASO", 2))
    puertos_env = os.environ.get("PUERTOS", "8006,8007,8008")
    PUERTOS = [int(p.strip()) for p in puertos_env.split(",")]
    
    BASE_URL = os.environ.get("API_VENTAS_URL", "http://187.251.135.245")
    URL_HUMAN = os.environ.get("URL_HUMAN", "https://talenhuman.com/api/Sales/batch")
    API_KEY_HUMAN = os.environ.get("API_KEY_HUMAN", "th_badac99af8df42679c8626852004f770")

    AUTH_DATA = {
        "username": os.environ.get("API_VENTAS_USER", "CocinaMX2026"),
        "password": os.environ.get("API_VENTAS_PASS", "C0c!nA*987"),
        "grant_type": "password"
    }

    log_ejecucion = []
    inicio_total = time.time()
    headers_human = {"X-Api-Key": API_KEY_HUMAN, "Content-Type": "application/json"}
    hoy = datetime.now()

    # Función auxiliar para hacer peticiones HTTP sin la librería 'requests'
    def hacer_peticion(url, method="GET", headers=None, data=None, params=None):
        if params:
            url = f"{url}?{urllib.parse.urlencode(params)}"
            
        req = urllib.request.Request(url, method=method)
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
                
        if not req.has_header('User-Agent') and not req.has_header('User-agent'):
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
        if data is not None:
            # Si el content-type es urlencoded, transformamos el diccionario a urlencoded
            # Usamos 'Content-type' (con t minúscula) que es como urllib suele guardarlo internamente,
            # pero verificamos ambas formas por seguridad
            ctype = req.get_header('Content-Type', req.get_header('Content-type', ''))
            
            if isinstance(data, (dict, list)):
                if isinstance(data, dict) and ctype.startswith('application/x-www-form-urlencoded'):
                    data = urllib.parse.urlencode(data).encode('utf-8')
                else:
                    data = json.dumps(data).encode('utf-8')
                    if not req.has_header('Content-Type') and not req.has_header('Content-type'):
                        req.add_header('Content-Type', 'application/json')
            elif isinstance(data, str):
                data = data.encode('utf-8')
                    
        try:
            with urllib.request.urlopen(req, data=data, timeout=30) as response:
                status = response.status
                body = response.read().decode('utf-8')
                return status, json.loads(body) if body else None
        except urllib.error.HTTPError as e:
            return e.code, None
        except Exception as e:
            raise e

    # 2. FUNCIÓN DE PROCESAMIENTO
    def procesar_fuente(puerto, fecha, token):
        url_ventas = f"{BASE_URL}:{puerto}/api/GetPedidos/GetPedidos/"
        headers_v = {"Authorization": f"Bearer {token}"}
        
        info_intento = {
            "Fecha": fecha, 
            "Puerto": puerto, 
            "Extraccion": 0, 
            "Carga": 0, 
            "Status_API": None, 
            "Registros": 0
        }

        try:
            # A. Extracción
            t0 = time.time()
            status_code, datos = hacer_peticion(url_ventas, headers=headers_v, params={'fechaDesde': fecha, 'fechaHasta': fecha})
            info_intento["Extraccion"] = round(time.time() - t0, 2)

            if status_code == 204 or not datos:
                info_intento["Status_API"] = "Sin Datos (204)"
                return info_intento

            # B. Transformación Nativa (Sin Pandas)
            # Agrupación usando diccionarios
            grupos = {}
            
            for registro in datos:
                # Filtrar cancelados
                if registro.get('Cancelado', False) == True:
                    continue
                    
                hora_captura = registro.get('Hora_Captura')
                if not hora_captura:
                    continue
                    
                # Parsear fecha de forma robusta
                try:
                    hc_clean = hora_captura.strip().replace('Z', '+00:00')
                    if 'T' in hc_clean:
                        dt = datetime.fromisoformat(hc_clean)
                    else:
                        # A veces viene con espacio en vez de T en formatos tipo ISO
                        # Intentar convertirlo a ISO primero
                        try:
                            dt = datetime.fromisoformat(hc_clean.replace(' ', 'T'))
                        except ValueError:
                            # Quitar milisegundos si los hay (ej. .123) sin dañar "a. m."
                            hc_base = re.sub(r'\.\d+', '', hc_clean).strip()
                        
                        # Reemplazar formatos de AM/PM en español
                        hc_base = hc_base.replace('a. m.', 'AM').replace('p. m.', 'PM')
                        hc_base = hc_base.replace('a.m.', 'AM').replace('p.m.', 'PM')
                        
                        try:
                            # Formato 12 horas con AM/PM (Ej: 09/09/2026 07:52:02 AM)
                            dt = datetime.strptime(hc_base, '%d/%m/%Y %I:%M:%S %p')
                        except ValueError:
                            try:
                                # Formato 12 horas con año primero
                                dt = datetime.strptime(hc_base, '%Y-%m-%d %I:%M:%S %p')
                            except ValueError:
                                try:
                                    # Formato 24 horas normal
                                    dt = datetime.strptime(hc_base, '%d/%m/%Y %H:%M:%S')
                                except ValueError:
                                    dt = datetime.strptime(hc_base, '%Y-%m-%d %H:%M:%S')
                except Exception as e:
                    print(f"⚠️ Saltando registro. Fecha no reconocida: '{hora_captura}'")
                    continue
                
                # Redondear a la franja de 30 minutos más cercana hacia abajo
                minuto_franja = (dt.minute // 30) * 30
                record_date = dt.replace(minute=minuto_franja, second=0, microsecond=0)
                
                tipo_pedido = str(registro.get('Tipo_Pedido', ''))
                codigo_local = str(registro.get('Codigo_Local', ''))
                
                # Llave de agrupación
                llave = (record_date, tipo_pedido, codigo_local)
                
                if llave not in grupos:
                    grupos[llave] = {
                        "ventaNeta": 0.0,
                        "tickets": set(), # Para contar tickets únicos (nunique)
                        "comensales": 0
                    }
                
                # Acumular
                grupos[llave]["ventaNeta"] += float(registro.get('ImporteNeto', 0))
                grupos[llave]["tickets"].add(registro.get('Codigo'))
                grupos[llave]["comensales"] += int(registro.get('Comensales', 0))

            if not grupos:
                info_intento["Status_API"] = "Sin datos válidos"
                return info_intento

            # C. Payload
            payload = []
            for (record_date, tipo_pedido, codigo_local), acumulado in grupos.items():
                venta_neta = acumulado["ventaNeta"]
                comensales = acumulado["comensales"]
                cantidad_tickets = len(acumulado["tickets"])
                ticket_promedio = (venta_neta / comensales) if comensales > 0 else 0.0
                
                payload.append({
                    "recordDate": record_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                    "ventaNeta": round(venta_neta, 2),
                    "cantidadTickets": cantidad_tickets,
                    "ticketPromedio": round(ticket_promedio, 2),
                    "canal": tipo_pedido,
                    "comensales": comensales,
                    "storeExternalId": codigo_local
                })

            # D. Carga a TalenHuman
            t_envio = time.time()
            post_status, _ = hacer_peticion(URL_HUMAN, method="POST", headers=headers_human, data=payload)
            info_intento["Carga"] = round(time.time() - t_envio, 2)
            info_intento["Status_API"] = post_status
            info_intento["Registros"] = len(payload)
            
            return info_intento

        except Exception as e:
            info_intento["Status_API"] = f"Error: {str(e)}"
            return info_intento

    # 3. EJECUCIÓN PRINCIPAL
    for puerto in PUERTOS:
        print(f"\n🔌 CONECTANDO AL PUERTO: {puerto}")
        
        # 3.1 Autenticación por Puerto
        try:
            url_auth = f"{BASE_URL}:{puerto}/Token"
            headers_auth = {"Content-Type": "application/x-www-form-urlencoded"}
            status_auth, data_auth = hacer_peticion(url_auth, method="POST", headers=headers_auth, data=AUTH_DATA)
            
            if status_auth != 200 or not data_auth:
                raise Exception(f"Código de estado HTTP: {status_auth}")
                
            token_actual = data_auth.get("access_token")
            print(f"✅ Autenticación exitosa en puerto {puerto}")
        except Exception as e:
            msg = f"❌ Saltando puerto {puerto} por error de auth: {e}"
            print(msg)
            log_ejecucion.append({"Puerto": puerto, "Status_API": "Error Auth", "Registros": 0})
            continue

        # 3.2 Procesamiento de días
        for i in range(dias_a_repasar, -1, -1):
            fecha_proc = (hoy - timedelta(days=i)).strftime('%Y-%m-%d')
            resultado = procesar_fuente(puerto, fecha_proc, token_actual)
            
            if resultado["Registros"] > 0:
                status = "✅" if resultado.get("Status_API") in [200, 201] else "❌"
                print(f"{status} {fecha_proc} | Regs: {resultado['Registros']} | Ext: {resultado['Extraccion']}s | Carga: {resultado['Carga']}s | Status: {resultado.get('Status_API')}")
            
            log_ejecucion.append(resultado)

    # 4. RESUMEN FINAL PARA DIGITAL OCEAN
    tiempo_total = round((time.time() - inicio_total)/60, 2)
    print(f"\n📊 RESUMEN GLOBAL | Tiempo Total: {tiempo_total} min")
    
    total_registros = sum(log.get("Registros", 0) for log in log_ejecucion)
    
    return {
        "body": {
            "status": "success",
            "message": "Sincronización de ventas finalizada",
            "total_registros_procesados": total_registros,
            "tiempo_total_minutos": tiempo_total,
            "logs": log_ejecucion
        }
    }
