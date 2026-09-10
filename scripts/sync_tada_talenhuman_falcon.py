import os
import requests
import json
from datetime import datetime

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de TADÁ
TADA_USER = os.environ.get("TADA_USERNAME", "MARIO.ALEJANDRO")
TADA_PASS = os.environ.get("TADA_PASSWORD", "I51TIhxRp55C")
TADA_BASE_URL = "https://servicios.tada.mx/services/api"

# Credenciales de TalenHuman
TALENHUMAN_API_URL = "https://talenhuman.com/api/integration/sync-employees"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY") # No usar fallback por seguridad

# Credenciales de Falcon Cloud
FALCON_SRV = "21"
FALCON_URL_BASE = f"https://falconcloud.co/site_srv{FALCON_SRV}_ph/site/api/service.php"
FALCON_USER = os.environ.get("FALCON_USERNAME", "ws@cocinasmexicanas.com")
FALCON_PASS = os.environ.get("FALCON_PASSWORD", "C0c1n@s.2026")
FALCON_ENTERPRISE_ID = os.environ.get("FALCON_ENTERPRISE_ID", "407")
FALCON_ENTERPRISE_NAME = os.environ.get("FALCON_ENTERPRISE_NAME", "Viral Flavor")

def main(event, context):
    print("🚀 INICIANDO ETL: TADÁ -> TalenHuman y Falcon Cloud")
    
    try:
        # 1. Autenticación en TADÁ
        print("1. Autenticando en TADÁ...")
        res_auth = requests.post(f"{TADA_BASE_URL}/Auth/Authenticate", 
                                 json={"username": TADA_USER, "password": TADA_PASS},
                                 headers={"Content-Type": "application/json", "Accept": "application/json"},
                                 timeout=30)
                                 
        if res_auth.status_code != 200:
            return {"status": "error", "message": f"Fallo Auth TADÁ: {res_auth.text}"}
            
        token = res_auth.json().get("token")
        
        # 2. Extracción de Empleados
        print("2. Descargando empleados de TADÁ...")
        res_emp = requests.get(f"{TADA_BASE_URL}/Empleados/GetEmpleados", 
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=60)
                               
        if res_emp.status_code != 200:
            return {"status": "error", "message": f"Fallo GetEmpleados: {res_emp.text}"}
            
        tada_empleados = res_emp.json().get("result", [])
        print(f"📥 Se encontraron {len(tada_empleados)} empleados en TADÁ.")
        
        if not tada_empleados:
            return {"status": "success", "message": "No hay empleados para sincronizar."}
            
        # 3. Transformación
        print("3. Transformando datos...")
        th_payload = []
        falcon_payloads = []
        
        for emp in tada_empleados:
            # Manejo de apellidos
            apellidos = f"{emp.get('apellidoPaterno', '')} {emp.get('apellidoMaterno', '')}".strip()
            
            # Fechas
            fecha_alta = emp.get("fechaAlta")
            fecha_baja = emp.get("fechaBaja")
            fecha_nac = emp.get("fechaNacimiento")
            
            # Limpiar correos vacíos
            correo = emp.get("correo")
            if not correo or correo.strip() == "":
                correo = f"{emp.get('claveEmpleado')}@noemail.com"

            # Parseo robusto del sexo/género
            sexo_raw = str(emp.get("sexo", "")).strip().upper()
            if sexo_raw.startswith('M'):
                genero = "M"
            elif sexo_raw.startswith('F'):
                genero = "F"
            else:
                genero = "M" # Por defecto M para evitar error 413 en Falcon
                
            # Formato de fecha específico para Falcon (AAAA-MM-DD)
            def format_fecha_falcon(f_raw):
                if not f_raw or f_raw == "0001-01-01":
                    return ""
                f_raw = str(f_raw).strip()
                # Si ya viene en formato AAAA-MM-DD lo pasamos igual
                return f_raw[:10]

            f_inicio_falcon = format_fecha_falcon(fecha_alta)
            f_fin_falcon = format_fecha_falcon(fecha_baja)

            # Payload para TalenHuman
            registro_th = {
                "IdentificationNumber": str(emp.get("claveEmpleado", "")),
                "FirstName": str(emp.get("nombres", "")),
                "LastName": apellidos,
                "Email": correo,
                "StoreCode": str(emp.get("claveSucursal", "SEDE_DEFAULT")),
                "StoreName": str(emp.get("sucursal", "SEDE GLOBAL")),
                "ProfileName": str(emp.get("puesto", "Perfil Default")),
                "DailySalary": 0, 
                "IsActive": emp.get("estatus", "").upper() == "ACTIVO",
                "Gender": genero, # Ya mapeado como M o F garantizado
                "DateOfEntry": f"{fecha_alta}T00:00:00Z" if fecha_alta and fecha_alta != "0001-01-01" else None,
                "DateOfTermination": f"{fecha_baja}T00:00:00Z" if fecha_baja else None,
                "BirthDate": f"{fecha_nac}T00:00:00Z" if fecha_nac and fecha_nac != "0001-01-01" else None
            }
            th_payload.append(registro_th)
            
            # Payload para Falcon Cloud: Solo enviar si el centro (claveSucursal) es numérico
            centro_str = str(emp.get("claveSucursal", "")).strip()
            if centro_str.isdigit():
                identificacion = str(emp.get("claveEmpleado", ""))
                
                # Para el status, Falcon puede esperar un string según tu Lakehouse
                # Si en Lakehouse tenías 'status', en TADÁ es 'estatus'
                estatus_falcon = "S" if emp.get("estatus", "").upper() == "ACTIVO" else "N"
                
                registro_falcon = {
                    "identification": identificacion,
                    "identification_device": identificacion,
                    "name": str(emp.get("nombres", "")),
                    "last_name": apellidos,
                    "identification_type": "ID_EMPLEADO",
                    "genre": genero,
                    "start_date": f_inicio_falcon,
                    "contract_type": "DEFAULT",
                    "enterprise": FALCON_ENTERPRISE_NAME, 
                    "status": estatus_falcon,
                    "branch_office": centro_str,
                    "schedule": "DEFAULT",
                    "position": str(emp.get("puesto", "")),
                    "devices": ""
                }
                falcon_payloads.append(registro_falcon)
            
        # 4. Carga a TalenHuman
        print(f"4. Enviando {len(th_payload)} empleados a TalenHuman...")
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

        # 5. Carga a Falcon Cloud
        print("5. Iniciando sincronización bidireccional con Falcon Cloud...")
        try:
            # Obtener Token en Falcon
            login_payload = {"username": FALCON_USER, "password": FALCON_PASS}
            token_res = requests.post(f"{FALCON_URL_BASE}/login", json=login_payload, timeout=30).json()
            token_falcon = token_res.get('token')
            
            if not token_falcon:
                print("❌ No se pudo obtener el token de Falcon.")
            else:
                headers_falcon = {"token": token_falcon, "Content-Type": "application/json"}
                
                # Barrido en Falcon
                for f_emp in falcon_payloads:
                    identificacion = f_emp["identification"]
                    url_get = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees?identification={identificacion}"
                    
                    try:
                        res_get = requests.get(url_get, headers=headers_falcon, timeout=10)
                        empleado_encontrado = None
                        
                        if res_get.status_code == 200:
                            datos_falcon = res_get.json()
                            # Extraer empleado ya sea que venga en lista o en dict
                            if isinstance(datos_falcon, list) and len(datos_falcon) > 0:
                                empleado_encontrado = datos_falcon[0]
                            elif isinstance(datos_falcon, dict):
                                for k, v in datos_falcon.items():
                                    if isinstance(v, list) and len(v) > 0:
                                        empleado_encontrado = v[0]
                                        break
                                        
                        if empleado_encontrado:
                            # Update (PUT)
                            falcon_id = empleado_encontrado.get("id")
                            f_emp["id"] = falcon_id # Añadir el ID interno de Falcon para el PUT
                            url_put = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees/{falcon_id}"
                            res_put = requests.put(url_put, json=f_emp, headers=headers_falcon, timeout=10)
                            try:
                                json_resp = res_put.json()
                                if json_resp.get("code") in [200, 201, 204]:
                                    print(f"🔄 Actualizado en Falcon: ID {identificacion}")
                                else:
                                    print(f"⚠️ Error al actualizar en Falcon ID {identificacion}: {json_resp.get('code')} - {json_resp.get('message')}")
                            except Exception:
                                print(f"⚠️ Error HTTP al actualizar en Falcon ID {identificacion}: {res_put.status_code} - {res_put.text}")
                        else:
                            # Create (POST)
                            url_post = f"{FALCON_URL_BASE}/enterprises/{FALCON_ENTERPRISE_ID}/employees"
                            res_post = requests.post(url_post, json=f_emp, headers=headers_falcon, timeout=10)
                            try:
                                json_resp = res_post.json()
                                if json_resp.get("code") in [200, 201]:
                                    print(f"➕ Creado en Falcon: ID {identificacion}")
                                else:
                                    print(f"⚠️ Error al crear en Falcon ID {identificacion}: {json_resp.get('code')} - {json_resp.get('message')}")
                            except Exception:
                                print(f"⚠️ Error HTTP al crear en Falcon ID {identificacion}: {res_post.status_code} - {res_post.text}")
                            
                    except Exception as e:
                        print(f"⚠️ Error con el empleado {identificacion} en Falcon: {e}")
        except Exception as e:
            print(f"❌ Error en la etapa de Falcon: {e}")

        return {"status": "success", "message": "Proceso ETL completado para TalenHuman y Falcon."}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Bloque para probarlo localmente (fuera de AWS Lambda)
if __name__ == "__main__":
    main({}, {})
