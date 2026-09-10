import os
import requests
from datetime import datetime, timedelta

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de TalenHuman
TALENHUMAN_API_URL_SYNC = "https://talenhuman.com/api/integration/sync-biometric"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY") 

# Credenciales de Falcon Cloud
FALCON_SRV = os.environ.get("FALCON_SRV", "21")
FALCON_URL_BASE = f"https://falconcloud.co/site_srv{FALCON_SRV}_ph/site/public/api/service.php"
FALCON_USER = os.environ.get("FALCON_USERNAME", "ws@cocinasmexicanas.com")
FALCON_PASS = os.environ.get("FALCON_PASSWORD", "C0c1n@s.2026")

# Credenciales de Open HR
OPENHR_BASE_URL = os.environ.get("OPENHR_BASE_URL", "http://humanet.does-it.net:8080/api")
OPENHR_USER = os.environ.get("OPENHR_USERNAME", "admin")
OPENHR_PASS = os.environ.get("OPENHR_PASSWORD", "password123")

# Parámetros de Extracción
# Si vas a correrlo cada 10 min, puedes dejar HORAS_ATRAS=1 (por precaución para recoger re-intentos)
HORAS_ATRAS = int(os.environ.get("HORAS_ATRAS", "1")) 

# Parámetros de Prueba
TEST_LIMIT = int(os.environ.get("TEST_LIMIT", "0")) # Si es > 0, limita la cantidad de registros

def format_date_to_iso(date_str):
    if not date_str:
        return None
    return str(date_str).strip().replace(" ", "T")

def format_date_to_isoz(date_str):
    iso = format_date_to_iso(date_str)
    return iso + "Z" if iso else None

def main(event, context):
    print("🚀 INICIANDO ETL: Falcon -> TalenHuman / OpenHR (Marcaciones Biométrica)")
    
    try:
        # Autenticación Open HR
        print("1. Autenticando en Open HR...")
        res_auth_oh = requests.post(f"{OPENHR_BASE_URL}/auth/token", 
                                    json={"username": OPENHR_USER, "password": OPENHR_PASS},
                                    timeout=30)
        if res_auth_oh.status_code != 200:
            return {"status": "error", "message": f"Fallo Auth Open HR: {res_auth_oh.text}"}
        token_openhr = res_auth_oh.json().get("token")
        headers_openhr = {"Authorization": f"Bearer {token_openhr}", "Content-Type": "application/json"}

        # Autenticación Falcon
        print("2. Autenticando en Falcon Cloud...")
        res_auth_f = requests.post(f"{FALCON_URL_BASE}/login", 
                                   json={"username": FALCON_USER, "password": FALCON_PASS}, timeout=30)
        if res_auth_f.status_code != 200:
            return {"status": "error", "message": f"Fallo Auth Falcon: {res_auth_f.status_code}"}
        token_falcon = res_auth_f.json().get("token")
        headers_falcon = {"token": token_falcon}

        # --- FLUJO: MARCACIONES ---
        ahora_colombia = datetime.utcnow() - timedelta(hours=5)
        fecha_fin_falcon = ahora_colombia.strftime("%Y-%m-%d %H:%M:%S")
        fecha_ini_falcon = (ahora_colombia - timedelta(hours=HORAS_ATRAS)).strftime("%Y-%m-%d %H:%M:%S")
        
        print(f"\n3. Descargando marcaciones Falcon ({fecha_ini_falcon} a {fecha_fin_falcon})...")
        all_data_falcon = []
        page = 1
        total_pages = 1
        
        while page <= total_pages:
            params = {"date_from": fecha_ini_falcon, "date_to": fecha_fin_falcon, "per_page": 50, "page": page}
            res_att = requests.get(f"{FALCON_URL_BASE}/v2/attendances", headers=headers_falcon, params=params, timeout=60)
            if res_att.status_code == 200:
                json_res = res_att.json()
                batch = json_res.get("data", [])
                pagination = json_res.get("pagination", {})
                if pagination: total_pages = pagination.get("last_page", 1)
                all_data_falcon.extend(batch)
                page += 1
            else:
                print(f"⚠️ Error en API Falcon (página {page}): {res_att.status_code}")
                break
                
        if TEST_LIMIT > 0:
            all_data_falcon = all_data_falcon[:TEST_LIMIT]
            print(f"🛠️ MODO PRUEBA ACTIVO: Solo se procesarán {TEST_LIMIT} marcaciones.")

        print(f"📥 {len(all_data_falcon)} marcaciones encontradas en Falcon.")
        
        if all_data_falcon:
            payload_th = []
            payload_oh_marc = []
            ahora_iso = ahora_colombia.strftime("%Y-%m-%dT%H:%M:%S")

            for fila in all_data_falcon:
                f_time = str(fila.get("time", ""))
                # Para TalenHuman
                payload_th.append({
                    "deviceId": str(fila.get("device", "")),
                    "deviceUser": str(fila.get("device_user_id", "")),
                    "marcacion": format_date_to_isoz(f_time),
                    "creationDate": format_date_to_isoz(fila.get("creation_date")),
                    "attendanceStatusId": str(fila.get("attendance_status_id", "")),
                    "verification_mode_id": str(fila.get("verification_mode_id", ""))
                })
                
                # Para Open HR
                try:
                    dt_marcacion = datetime.strptime(f_time, "%Y-%m-%d %H:%M:%S")
                    fecha_m = dt_marcacion.strftime("%Y-%m-%dT00:00:00")
                    hora_m = dt_marcacion.strftime("%H:%M")
                except:
                    fecha_m = f_time[:10] + "T00:00:00" if len(f_time) >= 10 else ""
                    hora_m = f_time[11:16] if len(f_time) >= 16 else ""

                payload_oh_marc.append({
                    "diviceId": str(fila.get("device", "")),
                    "user": str(fila.get("device_user_id", "")),
                    "marcacionDate": format_date_to_iso(f_time),
                    "fechaMarcacion": fecha_m,
                    "horaMarcacion": hora_m,
                    "creation_date": format_date_to_iso(fila.get("creation_date")),
                    "attendance_status_id": str(fila.get("attendance_status_id", "")),
                    "verification_mode_id": str(fila.get("verification_mode_id", "")),
                    "fechaSincronizacion": ahora_iso
                })
            
            # Enviar a TalenHuman
            print(f"4. Enviando {len(payload_th)} marcaciones a TalenHuman...")
            res_th = requests.post(TALENHUMAN_API_URL_SYNC, json=payload_th, headers={"X-Api-Key": TALENHUMAN_API_KEY, "Content-Type": "application/json"}, timeout=60)
            if res_th.status_code in [200, 201]:
                print("✅ Marcaciones sincronizadas con TalenHuman.")
            else:
                print(f"❌ Fallo marcaciones a TH: {res_th.status_code} - {res_th.text}")
                
            # Enviar a Open HR
            print(f"5. Enviando {len(payload_oh_marc)} marcaciones a Open HR...")
            res_oh_m = requests.post(f"{OPENHR_BASE_URL}/biometric/marcaciones", json=payload_oh_marc, headers=headers_openhr, timeout=60)
            if res_oh_m.status_code in [200, 201]:
                print("✅ Marcaciones sincronizadas con Open HR.")
            else:
                print(f"❌ Fallo marcaciones a Open HR: {res_oh_m.status_code} - {res_oh_m.text}")
            
        return {"status": "success", "message": "Proceso ETL completado (Marcaciones)."}

    except Exception as e:
        print(f"💥 ERROR CRÍTICO: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    main({}, {})
