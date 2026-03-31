const fs = require('fs');
const path = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Corregir onClick (Eliminar redundancia y añadir Snapshot)
const oldOnClick = /onClick=\{\(\)\s*=>\s*\{\s*if\s*\(isLocked\)\s*\{\s*showToast\("Turno bloqueado:\s*Ya procesado o histórico",\s*"info"\);\s*return;\s*\}\s*if\s*\(isLocked\)\s*\{\s*showToast\("Turno bloqueado:\s*Ya procesado o histórico",\s*"info"\);\s*return;\s*\}\s*setPendingEvent/;
const newOnClick = `onClick={(e) => {
                                                                                 if (isLocked) {
                                                                                     if (att) {
                                                                                         setSnapshotData({ ...shift, att, shiftTime, attTime });
                                                                                         setShowSnapshotModal(true);
                                                                                     } else {
                                                                                         showToast("Turno bloqueado: Dato histórico", "info");
                                                                                     }
                                                                                     return;
                                                                                 }
                                                                                 setPendingEvent`;
content = content.replace(oldOnClick, newOnClick);

// 2. Corregir className y Visibilidad de Iconos
const oldVisuals = /className=\{\`group rounded-xl p-1\.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative \$\{isLocked \? 'cursor-not-allowed opacity-\[0\.9\]' : 'cursor-grab active:cursor-grabbing hover:scale-\[1\.05\] hover:z-50'\}\`\}\s*style=\{\{ background: bgColor, minWidth: '85px', minHeight: '42px', filter: isLocked \? 'contrast\(0\.9\) saturate\(0\.8\)' : 'none' \}\}\s*>\s*<div className="flex items-center gap-1">\s*\{isLocked && <Lock size=\{7\} className="text-white opacity-60" \/>\}\s*\{att && <Activity size=\{7\} className="text-white opacity-80 animate-pulse" \/>\}/;
const newVisuals = `className={\`group rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative \${isLocked ? (att ? 'cursor-help hover:ring-2 ring-white/50 scale-105' : 'cursor-default opacity-[0.9]') : 'cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50'}\`}
                                                                              style={{ background: bgColor, minWidth: '85px', minHeight: '42px', filter: isLocked ? 'contrast(0.9) saturate(0.8)' : 'none' }}
                                                                         >
                                                                             <div className="flex items-center gap-2">
                                                                                  {isLocked && <Lock size={11} className="text-white opacity-60" />}
                                                                                  {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />} `;
content = content.replace(oldVisuals, newVisuals);

// 3. Corregir Badge de Estado (Más grande y llamativo)
const oldBadge = /\{att && \(\s*<div className=\{\`absolute -top-1 -right-1 w-2\.5 h-2\.5 rounded-full border border-white dark:border-slate-800 \$\{att\.status === 0 \? 'bg-emerald-400' : 'bg-rose-400'\} flex items-center justify-center shadow-sm\`\}>\s*\{att\.status === 0 \? <CheckCircle size=\{6\} \/> : <AlertCircle size=\{6\} \/>\}\s*<\/div>\s*\)\}/;
const newBadge = `{att && (
                                                                                 <div className={\`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 \${att.status === 0 ? 'bg-emerald-400' : 'bg-rose-400'} flex items-center justify-center shadow-lg animate-bounce z-10\`}>
                                                                                     {att.status === 0 ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                                                 </div>
                                                                             )}`;
content = content.replace(oldBadge, newBadge);

fs.writeFileSync(path, content);
console.log('Elite V12 Visibility Patch Applied Successfully.');
