import os
import requests
import json
from datetime import datetime

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de Open HR
OPENHR_USER = os.environ.get("OPENHR_USERNAME", "")
OPENHR_PASS = os.environ.get("OPENHR_PASSWORD", "")
OPENHR_BASE_URL = os.environ.get("OPENHR_BASE_URL", "")

# Credenciales de TalenHuman
TALENHUMAN_API_URL = "https://talenhuman.com/api/integration/sync-employees"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY") # No usar fallback por seguridad

# Credenciales de Falcon Cloud
FALCON_SRV = os.environ.get("FALCON_SRV", "21")
FALCON_URL_BASE = f"https://falconcloud.co/site_srv{FALCON_SRV}_ph/site/api/service.php"
FALCON_USER = os.environ.get("FALCON_USERNAME", "")
FALCON_PASS = os.environ.get("FALCON_PASSWORD", "")
FALCON_ENTERPRISE_ID = os.environ.get("FALCON_ENTERPRISE_ID", "407")
FALCON_ENTERPRISE_NAME = os.environ.get("FALCON_ENTERPRISE_NAME", "")

# Parámetros de Prueba
TEST_LIMIT = int(os.environ.get("TEST_LIMIT", "0")) # Si es > 0, limita la cantidad de registros

def main(event, context):
    print("🚀 INICIANDO ETL: Open HR -> TalenHuman y Falcon Cloud")
    
    try:
        # 1. Autenticación en Open HR
        print("1. Autenticando en Open HR...")
        res_auth_oh = requests.post(f"{OPENHR_BASE_URL}/auth/token", 
                                    json={"username": OPENHR_USER, "password": OPENHR_PASS},
                                    headers={"Content-Type": "application/json"},
                                    timeout=30)
                                 
        if res_auth_oh.status_code != 200:
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo Auth Open HR: {res_auth_oh.text}"}}
            
        token_openhr = res_auth_oh.json().get("token")
        
        # 2. Extracción de Empleados de Open HR
        print("2. Descargando empleados de Open HR...")
        res_emp = requests.get(f"{OPENHR_BASE_URL}/biometric/empleados-biometricos", 
                               headers={"Authorization": f"Bearer {token_openhr}"},
                               timeout=60)
                               
        if res_emp.status_code != 200:
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo al obtener empleados de Open HR: {res_emp.text}"}}
            
        openhr_empleados = res_emp.json()
        print(f"📥 Se encontraron {len(openhr_empleados)} empleados en Open HR.")
        
        if TEST_LIMIT > 0:
            openhr_empleados = openhr_empleados[:TEST_LIMIT]
            print(f"🛠️ MODO PRUEBA ACTIVO: Solo se procesarán {TEST_LIMIT} empleados.")
        
        if not openhr_empleados:
            return {"statusCode": 200, "body": {"status": "success", "message": "No hay empleados para sincronizar."}}
            
        # 2.5 Extracción de Tiendas (BiometricId) de TalenHuman
        print("2.5 Descargando tiendas de TalenHuman para mapear dispositivos biométricos...")
        mapa_tiendas = {}
        if TALENHUMAN_API_KEY:
            try:
                # El endpoint base se saca de TALENHUMAN_API_URL (quitando /sync-employees y agregando /stores)
                base_th_url = TALENHUMAN_API_URL.replace("/sync-employees", "")
                res_stores = requests.get(f"{base_th_url}/stores", 
                                          headers={"X-Api-Key": TALENHUMAN_API_KEY}, 
                                          timeout=30)
                if res_stores.status_code == 200:
                    tiendas_th = res_stores.json()
                    for t in tiendas_th:
                        biometric_id = str(t.get("biometricId") or "").strip()
                        if biometric_id:
                            if t.get("name"): mapa_tiendas[str(t["name"]).strip().upper()] = biometric_id
                            if t.get("code"): mapa_tiendas[str(t["code"]).strip().upper()] = biometric_id
                            if t.get("externalId"): mapa_tiendas[str(t["externalId"]).strip().upper()] = biometric_id
                    print(f"✅ Se cargaron {len(tiendas_th)} tiendas. Dispositivos mapeados: {len(set(mapa_tiendas.values()))}")
                else:
                    print(f"⚠️ No se pudieron obtener las tiendas de TH: {res_stores.status_code}")
            except Exception as e:
                print(f"⚠️ Error al obtener tiendas de TH: {e}")

        # 3. Transformación
        print("3. Transformando datos...")
        th_payload = []
        falcon_payloads = []
        
        for emp in openhr_empleados:
            identificacion = str(emp.get("identification", "")).strip()
            if not identificacion:
                continue

            nombres = str(emp.get("name", "")).strip()
            apellidos = str(emp.get("last_name", "")).strip()
            correo = emp.get("email")
            if not correo or correo.strip() == "":
                correo = f"{identificacion}@noemail.com"

            # Parseo robusto del sexo/género
            sexo_raw = str(emp.get("geener", "")).strip().upper()
            genero = "M" if sexo_raw.startswith('M') else ("F" if sexo_raw.startswith('F') else "M")
            
            estatus_str = str(emp.get("status", "")).strip().upper()
            # Si viene como "S", "ACTIVO", o "1", lo consideramos activo para TalenHuman
            es_activo = (estatus_str in ["ACTIVO", "S", "TRUE", "1"])

            # Fechas (Open HR las entrega como YYYY-MM-DD o null)
            fecha_alta = emp.get("start_date")
            fecha_baja = emp.get("end_date")
            fecha_nac = emp.get("birth_date")

            def parse_date(d_raw):
                if not d_raw: return None
                d_str = str(d_raw).strip()
                if d_str.lower() in ["", "none", "null", "0001-01-01", "0001-01-01t00:00:00", "na", "n/a"]: 
                    return None
                
                # Extraer solo la parte de la fecha (sin horas)
                d_str = d_str.split("T")[0].split(" ")[0]
                
                # Parsear formatos como DD/MM/YYYY a YYYY-MM-DD
                if "/" in d_str or "-" in d_str:
                    parts = d_str.replace("/", "-").split("-")
                    if len(parts) == 3:
                        if len(parts[2]) == 4: # Formato DD-MM-YYYY
                            d_str = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                        elif len(parts[0]) == 4: # Formato YYYY-MM-DD
                            d_str = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                # Parsear formato YYYYMMDD pegado (Ej: 19910727)
                elif len(d_str) == 8 and d_str.isdigit():
                    d_str = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
                
                return d_str

            def format_th_date(d_raw):
                d_str = parse_date(d_raw)
                if not d_str: return None
                return f"{d_str}T00:00:00Z"

            def format_falcon_date(d_raw):
                d_str = parse_date(d_raw)
                if not d_str: return ""
                return d_str

            sucursal = str(emp.get("branch_office", "DEFAULT")).strip()
            sucursal_upper = sucursal.upper()
            
            # Buscar ID Biométrico en el mapa de tiendas de TalenHuman
            device_id_mapped = mapa_tiendas.get(sucursal_upper, "")

            # --- Payload para TalenHuman ---
            registro_th = {
                "IdentificationNumber": identificacion,
                "FirstName": nombres,
                "LastName": apellidos,
                "Email": correo,
                "StoreCode": sucursal, # Open HR no tiene un ID numérico explícito en el ejemplo, usamos el nombre
                "StoreName": sucursal,
                "ProfileName": str(emp.get("position", "Perfil Default")).strip(),
                "DailySalary": float(emp.get("salary_Day") or 0), 
                "IsActive": es_activo,
                "Gender": genero,
                "DateOfEntry": format_th_date(fecha_alta),
                "DateOfTermination": format_th_date(fecha_baja),
                "BirthDate": format_th_date(fecha_nac)
            }
            th_payload.append(registro_th)
            
            # --- Payload para Falcon Cloud ---
            # Si OpenHR ya manda 'S' o 'N', usamos eso. Si no, lo calculamos.
            estatus_falcon = estatus_str if estatus_str in ["S", "N"] else ("S" if es_activo else "N")
            
            registro_falcon = {
                "identification": identificacion,
                "identification_device": identificacion,
                "name": nombres,
                "last_name": apellidos,
                "identification_type": "ID_EMPLEADO",
                "genre": genero,
                "start_date": format_falcon_date(fecha_alta),
                "contract_type": "DEFAULT",
                "enterprise": "COCINAS MEXICANAS", # Forzado según tu script base
                "status": estatus_falcon,
                "branch_office": sucursal,
                "schedule": "DEFAULT", # Forzado a DEFAULT en lugar del turno
                "position": str(emp.get("position", "")),
                "devices": str(emp.get("devices", "")).replace(',', ':') if emp.get("devices") else device_id_mapped
            }
            falcon_payloads.append(registro_falcon)
            
        # 4. Carga a TalenHuman
        print(f"4. Enviando {len(th_payload)} empleados a TalenHuman...")
        if TALENHUMAN_API_KEY:
            try:
                res_th = requests.post(TALENHUMAN_API_URL, 
                                       json=th_payload, 
                                       headers={"Content-Type": "application/json", "X-Api-Key": TALENHUMAN_API_KEY},
                                       timeout=60)
                                       
                if res_th.status_code == 200:
                    resultado = res_th.json()
                    print(f"✅ ÉXITO TH: {resultado.get('created')} Nuevos | {resultado.get('updated')} Actualizados")
                else:
                    print(f"❌ Fallo envío a TH: {res_th.status_code} - {res_th.text}")
            except Exception as e:
                print(f"❌ Error al enviar a TalenHuman: {e}")
        else:
            print("⚠️ Saltando TalenHuman (No hay TALENHUMAN_API_KEY configurada).")

        # 5. Carga a Falcon Cloud
        print("5. Iniciando sincronización bidireccional con Falcon Cloud...")
        try:
            # Obtener Token en Falcon
            login_payload = {"username": FALCON_USER, "password": FALCON_PASS}
            token_res = requests.post(f"{FALCON_URL_BASE}/login", json=login_payload, timeout=30)
            
            if token_res.status_code != 200:
                print(f"❌ No se pudo autenticar en Falcon: {token_res.status_code} - {token_res.text}")
            else:
                token_falcon = token_res.json().get('token')
                headers_falcon = {"token": token_falcon, "Content-Type": "application/json"}
                
                # Barrido en Falcon
                for f_emp in falcon_payloads:
                    identificacion_falcon = f_emp["identification"]
                    url_get = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees?identification={identificacion_falcon}"
                    
                    try:
                        res_get = requests.get(url_get, headers=headers_falcon, timeout=10)
                        empleado_encontrado = None
                        
                        if res_get.status_code == 200:
                            datos_falcon = res_get.json()
                            if isinstance(datos_falcon, dict) and "employees" in datos_falcon:
                                lst = datos_falcon["employees"]
                                if len(lst) > 0:
                                    empleado_encontrado = lst[0]
                            # Búsquedas alternativas según como devuelve Falcon a veces
                            elif isinstance(datos_falcon, list) and len(datos_falcon) > 0:
                                empleado_encontrado = datos_falcon[0]
                                        
                        if empleado_encontrado:
                            # Update (PUT)
                            falcon_id = empleado_encontrado.get("id")
                            f_emp["id"] = falcon_id 
                            url_put = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees/{falcon_id}"
                            
                            if TEST_LIMIT > 0:
                                print(f"\n🔍 [MODO PRUEBA] Payload PUT a Falcon:\n{json.dumps(f_emp, indent=2)}\n")
                                
                            res_put = requests.put(url_put, json=f_emp, headers=headers_falcon, timeout=10)
                            try:
                                json_resp = res_put.json()
                                if json_resp.get("code") in [200, 201, 204]:
                                    print(f"🔄 Actualizado en Falcon: ID {identificacion_falcon}")
                                else:
                                    print(f"⚠️ Error al actualizar en Falcon ID {identificacion_falcon}: {json_resp.get('code')} - {json_resp.get('message')}")
                            except Exception:
                                print(f"⚠️ Error HTTP al actualizar en Falcon ID {identificacion_falcon}: {res_put.status_code} - {res_put.text}")
                        else:
                            # Create (POST)
                            url_post = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees"
                            
                            if TEST_LIMIT > 0:
                                print(f"\n🔍 [MODO PRUEBA] Payload POST a Falcon:\n{json.dumps(f_emp, indent=2)}\n")
                                
                            res_post = requests.post(url_post, json=f_emp, headers=headers_falcon, timeout=10)
                            try:
                                json_resp = res_post.json()
                                if json_resp.get("code") in [200, 201]:
                                    print(f"➕ Creado en Falcon: ID {identificacion_falcon}")
                                else:
                                    print(f"⚠️ Error al crear en Falcon ID {identificacion_falcon}: {json_resp.get('code')} - {json_resp.get('message')}")
                            except Exception:
                                print(f"⚠️ Error HTTP al crear en Falcon ID {identificacion_falcon}: {res_post.status_code} - {res_post.text}")
                            
                    except Exception as e:
                        print(f"⚠️ Error de red con el empleado {identificacion_falcon} en Falcon: {e}")
        except Exception as e:
            print(f"❌ Error en la etapa de Falcon: {e}")

        return {"statusCode": 200, "body": {"status": "success", "message": "Proceso ETL completado para TalenHuman y Falcon."}}

    except Exception as e:
        print(f"💥 ERROR CRÍTICO: {e}")
        return {"statusCode": 500, "body": {"status": "error", "message": str(e)}}

if __name__ == "__main__":
    main({}, {})
