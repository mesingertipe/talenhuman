import os
import re

def repair_scheduler():
    path = r'd:\Tito Pedraza\OneDrive\Proyectos\Codigo Fuente\repos\HumanCore\src\TalenHuman.Web\src\pages\Scheduling\ShiftScheduler.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Reparar useEffect faltante en L214
    # Buscamos el bloque de if que no tiene el useEffect arriba
    pattern = r'(\}, \[\]\);\s+)(if \(selectedStore \|\| approvalId\) \{)'
    replacement = r'\1    useEffect(() => {\n        \2'
    
    if 'useEffect(() => {\n        if (selectedStore || approvalId) {' not in content:
        content = re.sub(pattern, replacement, content)
        print("ShiftScheduler: useEffect header fixed.")
    
    # 2. Reparar Command Center (opcional si sigue roto, pero vamos a asegurar etiquetas)
    # Buscamos el style roto de borderRadius
    content = content.replace('style={{ borderRadius:             {/*', "style={{ borderRadius: '32px' }}>             {/*")
    content = content.replace('</div>\nbutton>\n                            </div>', '</div>')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def repair_approval():
    path = r'd:\Tito Pedraza\OneDrive\Proyectos\Codigo Fuente\repos\HumanCore\src\TalenHuman.Web\src\pages\Scheduling\ShiftApproval.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reparar metadata del historial
    old_line = '{log.userName} \u2022 {new Date(log.actionAt).toLocaleString(\'es-MX\', { day: \'2-digit\', month: \'short\', hour: \'2-digit\', minute: \'2-digit\' })}'
    new_block = """<span className="font-black text-indigo-500">{log.user || 'SISTEMA'}</span> • {log.date ? new Date(log.date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible'}"""
    
    if 'log.userName' in content:
        content = content.replace(old_line, new_block)
        print("ShiftApproval: History metadata fixed.")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    try:
        repair_scheduler()
        repair_approval()
        print("SUCCESS: Files repaired.")
    except Exception as e:
        print(f"ERROR: {e}")
