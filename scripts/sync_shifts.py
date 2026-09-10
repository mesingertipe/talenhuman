import os
import requests
from datetime import datetime, timedelta

# --- CONFIGURACIÓN DINÁMICA (Variables de Entorno) ---
# Credenciales de TalenHuman
TALENHUMAN_API_URL_SHIFTS = "https://talenhuman.com/api/integration/shifts"
TALENHUMAN_API_KEY = os.environ.get("TALENHUMAN_API_KEY") 

# Credenciales de Open HR
OPENHR_BASE_URL = os.environ.get("OPENHR_BASE_URL", "http://humanet.does-it.net:8080/api")
OPENHR_USER = os.environ.get("OPENHR_USERNAME", "admin")
OPENHR_PASS = os.environ.get("OPENHR_PASSWORD", "password123")

# Parámetros de Extracción
# Para correr una vez al día, puedes buscar de los últimos 1 o 2 días.
DIAS_ATRAS_DESCANSOS = int(os.environ.get("DIAS_ATRAS_DESCANSOS", "1")) 

# Parámetros de Prueba
TEST_LIMIT = int(os.environ.get("TEST_LIMIT", "0")) # Si es > 0, limita la cantidad de registros

def main(event, context):
    print("🚀 INICIANDO ETL: TalenHuman -> OpenHR (Solo Descansos)")
    
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

        # --- FLUJO: DESCANSOS ---
        ahora_colombia = datetime.utcnow() - timedelta(hours=5)
        str_fecha_fin = ahora_colombia.strftime('%Y-%m-%d')
        str_fecha_inicio = (ahora_colombia - timedelta(days=DIAS_ATRAS_DESCANSOS)).strftime('%Y-%m-%d')
        print(f"\n2. Descargando descansos de TalenHuman ({str_fecha_inicio} a {str_fecha_fin})...")
        
        params_descansos = {
            "startDate": str_fecha_inicio,
            "endDate": str_fecha_fin,
            "isDescanso": "true"
        }
        res_desc = requests.get(TALENHUMAN_API_URL_SHIFTS, headers={"X-Api-Key": TALENHUMAN_API_KEY}, params=params_descansos, timeout=60)
        
        if res_desc.status_code == 200:
            raw_data = res_desc.json()
            print(f"📥 {len(raw_data)} descansos encontrados en TalenHuman.")
            
            if TEST_LIMIT > 0:
                raw_data = raw_data[:TEST_LIMIT]
                print(f"🛠️ MODO PRUEBA ACTIVO: Solo se procesarán {TEST_LIMIT} descansos.")
            
            if raw_data:
                payload_oh_desc = []
                ahora_iso = ahora_colombia.strftime("%Y-%m-%dT%H:%M:%S")
                for d in raw_data:
                    emp = d.get("employee", {}) or {}
                    store = d.get("store", {}) or {}
                    
                    payload_oh_desc.append({
                        "user": str(emp.get("identificationNumber", "")),
                        "fechaDescanso": str(d.get("startTime", ""))[:10],
                        "ceco": str(store.get("externalId", "")),
                        "fechaSincronizacion": ahora_iso
                    })
                
                print(f"3. Enviando {len(payload_oh_desc)} descansos a Open HR...")
                res_oh_d = requests.post(f"{OPENHR_BASE_URL}/biometric/descansos", json=payload_oh_desc, headers=headers_openhr, timeout=60)
                if res_oh_d.status_code in [200, 201]:
                    print("✅ Descansos sincronizados con Open HR.")
                else:
                    print(f"❌ Fallo descansos a Open HR: {res_oh_d.status_code} - {res_oh_d.text}")
        else:
            print(f"❌ Error al consultar descansos en TH: {res_desc.status_code} - {res_desc.text}")
            
        return {"status": "success", "message": "Proceso ETL completado (Descansos)."}

    except Exception as e:
        print(f"💥 ERROR CRÍTICO: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    main({}, {})
