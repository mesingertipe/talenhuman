const fs = require('fs');
const path = require('path');

const filePath = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inyectar isLocked y bloquear eventos
content = content.replace(
    /return\s*\(\s*<div\s*key=\{si\}\s*draggable\s*onDragStart=\{e\s*=>\s*handleDragStart\(e,\s*'GRID',\s*\{\s*employeeId:\s*emp\.id,\s*date:\s*day,\s*shiftId:\s*shift\.id\s*\}\)\}/g,
    `const isLocked = !!att || new Date(day) < new Date(new Date().setHours(0,0,0,0));
                                                                     
                                                                     return (
                                                                         <div key={si} 
                                                                              draggable={!isLocked} 
                                                                              onDragStart={e => {
                                                                                  if (isLocked) { e.preventDefault(); return; }
                                                                                  handleDragStart(e, 'GRID', { employeeId: emp.id, date: day, shiftId: shift.id });
                                                                              }}`
);

// 2. Bloquear onClick y onMouseEnter
content = content.replace(
    /onClick=\{\(\)\s*=>\s*\{/g,
    `onClick={() => {
                                                                                 if (isLocked) {
                                                                                     showToast("Turno bloqueado: Ya procesado o histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 `
);

// 3. Pasar isLocked al hover
content = content.replace(
    /setHoveredShiftData\(\{\s*\.\.\.shift,\s*att,\s*shiftTime,\s*attTime\s*\}\)/g,
    `setHoveredShiftData({ ...shift, att, shiftTime, attTime, isLocked })`
);

// 4. Cambiar cursor y añadir visual de bloqueo
content = content.replace(
    /className="group rounded-xl p-1\.5 flex flex-col items-center justify-center text-white shadow-md transition-all cursor-grab active:cursor-grabbing hover:scale-\[1\.08\] hover:z-50 relative"/g,
    `className={\`group rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative \${isLocked ? 'cursor-not-allowed opacity-[0.9]' : 'cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50'}\`}`
);

// 5. Añadir estilos dinámicos
content = content.replace(
    /style=\{\{\s*background:\s*bgColor,\s*minWidth:\s*'85px',\s*minHeight:\s*'42px'\s*\}\}/g,
    `style={{ background: bgColor, minWidth: '85px', minHeight: '42px', filter: isLocked ? 'contrast(0.9) saturate(0.8)' : 'none' }}`
);

// 6. Añadir icono Lock al renderizado
content = content.replace(
    /<span className="text-\[7px\] font-black uppercase tracking-\[0\.1em\] opacity-80 leading-none">/g,
    `<div className="flex items-center gap-1">
                                                                                 {isLocked && <Lock size={7} className="text-white opacity-60" />}
                                                                                 <span className="text-[7px] font-black uppercase tracking-[0.1em] opacity-80 leading-none">`
);

// Close the div correctly if we open it
content = content.replace(
    /<\/span>\s*<\/div>\s*<span className=\{\`text-\[8px\]/g,
    `</span>
                                                                             </div>
                                                                             <span className={\`text-[8px]`
);

fs.writeFileSync(filePath, content);
console.log('Elite Security applied successfully.');
