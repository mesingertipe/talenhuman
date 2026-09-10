import os
import requests
from datetime import datetime, timedelta

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de TalenHuman
TALENHUMAN_API_URL = "https://talenhuman.com/api/integration/sync-biometric"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY") 

# Credenciales de Falcon Cloud
FALCON_SRV = os.environ.get("FALCON_SRV", "21")
FALCON_URL_BASE = f"https://falconcloud.co/site_srv{FALCON_SRV}_ph/site/public/api/service.php"
FALCON_USER = os.environ.get("FALCON_USERNAME", "ws@cocinasmexicanas.com")
FALCON_PASS = os.environ.get("FALCON_PASSWORD", "C0c1n@s.2026")

# Parámetro de Extracción
HORAS_ATRAS = int(os.environ.get("HORAS_ATRAS", "12")) # 12 horas por defecto

def format_date_to_iso(date_str):
    """Convierte 'YYYY-MM-DD HH:MM:SS' a 'YYYY-MM-DDTHH:MM:SSZ'"""
    if not date_str:
        return None
    return str(date_str).strip().replace(" ", "T") + "Z"

def main(event, context):
    print("🚀 INICIANDO ETL: Falcon Cloud -> TalenHuman (Marcaciones Biométricas)")
    
    try:
        if not TALENHUMAN_API_KEY:
            return {"statusCode": 500, "body": {"status": "error", "message": "Falta la variable de entorno TALENHUMAN_API_KEY"}}

        # 1. Calcular Rango de Fechas
        # Usamos UTC y ajustamos manualmente restando 5 horas para simular la hora de Colombia
        # (Esto evita tener que instalar la librería externa 'pytz' en el servidor/lambda)
        ahora_colombia = datetime.utcnow() - timedelta(hours=5)
        fecha_fin = ahora_colombia.strftime("%Y-%m-%d %H:%M:%S")
        fecha_ini = (ahora_colombia - timedelta(hours=HORAS_ATRAS)).strftime("%Y-%m-%d %H:%M:%S")

        print(f"📅 RANGO CONSULTA API ({HORAS_ATRAS} horas atrás): {fecha_ini} <---> {fecha_fin}")

        # 2. Autenticación en Falcon Cloud
        print("1. Autenticando en Falcon Cloud...")
        res_auth = requests.post(f"{FALCON_URL_BASE}/login", 
                                 json={"username": FALCON_USER, "password": FALCON_PASS}, 
                                 timeout=30)
                                 
        if res_auth.status_code != 200:
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo Auth Falcon: {res_auth.status_code} - {res_auth.text}"}}
            
        token_falcon = res_auth.json().get("token")
        if not token_falcon:
            return {"statusCode": 500, "body": {"status": "error", "message": "No se recibió un token de Falcon Cloud"}}

        # 3. Extracción de Marcaciones (Paginación)
        print("2. Descargando marcaciones de Falcon Cloud...")
        headers_falcon = {"token": token_falcon}
        all_data = []
        page = 1
        total_pages = 1
        
        while page <= total_pages:
            params = {"date_from": fecha_ini, "date_to": fecha_fin, "per_page": 50, "page": page}
            res_att = requests.get(f"{FALCON_URL_BASE}/v2/attendances", headers=headers_falcon, params=params, timeout=60)
            
            if res_att.status_code == 200:
                json_res = res_att.json()
                batch = json_res.get("data", [])
                
                # Actualizar total de páginas si existe en la respuesta
                pagination = json_res.get("pagination", {})
                if pagination:
                    total_pages = pagination.get("last_page", 1)
                else:
                    # Por precaución, si no hay paginación en la respuesta, salimos después de la primera
                    total_pages = 1
                    
                all_data.extend(batch)
                print(f"   -> Página {page}/{total_pages} descargada ({len(batch)} registros)")
                page += 1
            else:
                print(f"⚠️ Error en API Falcon (página {page}): {res_att.status_code}")
                break

        print(f"📥 Total de marcaciones encontradas: {len(all_data)}")

        if not all_data:
            return {"statusCode": 200, "body": {"status": "success", "message": "No hay marcaciones para sincronizar en este rango de tiempo."}}

        # 4. Transformación de Datos para TalenHuman
        print("3. Transformando datos al formato de TalenHuman...")
        payload_talenhuman = []
        
        for fila in all_data:
            item = {
                "deviceId": str(fila.get("device", "")),
                "deviceUser": str(fila.get("device_user_id", "")),
                "marcacion": format_date_to_iso(fila.get("time")),
                "creationDate": format_date_to_iso(fila.get("creation_date")),
                "attendanceStatusId": str(fila.get("attendance_status_id", "")),
                "verification_mode_id": str(fila.get("verification_mode_id", ""))
            }
            payload_talenhuman.append(item)

        # 5. Envío a TalenHuman
        print(f"4. Inyectando {len(payload_talenhuman)} marcaciones a TalenHuman...")
        headers_talen = {
            "Content-Type": "application/json",
            "X-Api-Key": TALENHUMAN_API_KEY
        }
        
        res_th = requests.post(TALENHUMAN_API_URL, json=payload_talenhuman, headers=headers_talen, timeout=60)
        
        if res_th.status_code in [200, 201]:
            print("✅ ¡Éxito! Marcaciones sincronizadas exitosamente con TalenHuman.")
            return {"statusCode": 200, "body": {"status": "success", "message": f"{len(payload_talenhuman)} marcaciones sincronizadas."}}
        else:
            print(f"❌ Fallo envío a TH: {res_th.status_code} - {res_th.text}")
            return {"statusCode": 500, "body": {"status": "error", "message": f"Fallo en TH: {res_th.status_code}"}}

    except Exception as e:
        print(f"💥 ERROR CRÍTICO: {str(e)}")
        return {"statusCode": 500, "body": {"status": "error", "message": str(e)}}

# Bloque para ejecución local/Cron
if __name__ == "__main__":
    main({}, {})
