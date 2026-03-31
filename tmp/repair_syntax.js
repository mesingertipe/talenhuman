const fs = require('fs');
const path = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. REPARAR EL BLOQUE DE INDICADORES (DIVS MAL CERRADAS Y ICONOS DOBLES)
// Buscamos el pattern exacto que quedo mal
const malFormedBlock = /<div\s+className="flex\s+items-center\s+gap-1">\s*<div\s+className="flex\s+items-center\s+gap-2\s+mb-0\.5">\s*\{isLocked\s*&&\s*<Lock\s+size=\{11\}\s+className="text-white\s+opacity-70"\s*\/>\}\s*\{att\s*&&\s*<Activity\s+size=\{12\}\s+className="text-white\s+opacity-100\s+animate-pulse"\s*\/>\}\s*\{att\s*&&\s*<Activity\s+size=\{7\}\s+className="text-white\s+opacity-80\s+animate-pulse"\s*\/>\}\s*<span\s+className="text-\[7px\]\s+font-black\s+uppercase\s+tracking-\[0\.1em\]\s+opacity-80\s+leading-none">\s*\{viewMode\s*===\s*'SHIFTS'\s*\?\s*\(shift\.isDescanso\s*\?\s*'DESC'\s*:\s*shift\.isFuera\s*\?\s*'FUERA'\s*:\s*'TURNO'\)\s*:\s*'MARCACIÓN'\}\s*<\/span>\s*<\/div>\s*<\/div>/g;

const wellFormedBlock = `<div className="flex items-center gap-2 mb-0.5">
                                                                                 {isLocked && <Lock size={11} className="text-white opacity-70" />}
                                                                                 {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />}
                                                                                 <span className="text-[7px] font-black uppercase tracking-[0.1em] opacity-80 leading-none">
                                                                                    {viewMode === 'SHIFTS' ? (shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO') : 'MARCACIÓN'}
                                                                                 </span>
                                                                             </div>`;

content = content.replace(malFormedBlock, wellFormedBlock);

// 2. DOBLE CHEQUEO: Si por alguna razon el regex anterior no hizo match por las indentaciones...
if (!content.includes('Lock size={11}')) {
    // Intento con un replace un poco mas agresivo para la parte de los iconos
    content = content.replace(
        /<div className="flex items-center gap-1">\s*<div className="flex items-center gap-2 mb-0\.5">\s*\{isLocked && <Lock size=\{11\}[\s\S]*?<\/div>\s*<\/div>/,
        wellFormedBlock
    );
}

fs.writeFileSync(path, content);
console.log('Elite V12 Syntax Repair Applied Successfully.');
