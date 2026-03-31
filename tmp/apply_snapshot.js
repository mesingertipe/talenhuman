const fs = require('fs');
const filePath = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modificar onClick para soportar Snapshot Modal
content = content.replace(
    /onClick=\{\(\)\s*=>\s*\{\s*if\s*\(isLocked\)\s*\{\s*if\s*\(att\)\s*\{\s*setSnapshotData\(\{\s*\.\.\.shift,\s*att,\s*shiftTime,\s*attTime\s*\}\);\s*setShowSnapshotModal\(true\);\s*\}\s*else\s*\{\s*showToast\("Turno bloqueado:\s*Dato histórico",\s*"info"\);\s*\}\s*return;\s*\}/,
    `onClick={() => {
                                                                                 if (isLocked) {
                                                                                     if (att) {
                                                                                         setSnapshotData({ ...shift, att, shiftTime, attTime });
                                                                                         setShowSnapshotModal(true);
                                                                                     } else {
                                                                                         showToast("Turno bloqueado: Dato histórico", "info");
                                                                                     }
                                                                                     return;
                                                                                 }`
);

// Fallback if the previous replace failed (normal logic)
if (!content.includes('setShowSnapshotModal(true)')) {
    content = content.replace(
        /onClick=\{\(\)\s*=>\s*\{\s*if\s*\(isLocked\)\s*\{\s*showToast\("Turno bloqueado:\s*Ya procesado o histórico",\s*"info"\);\s*return;\s*\}/,
        `onClick={() => {
                                                                                 if (isLocked) {
                                                                                     if (att) {
                                                                                         setSnapshotData({ ...shift, att, shiftTime, attTime });
                                                                                         setShowSnapshotModal(true);
                                                                                     } else {
                                                                                         showToast("Turno bloqueado: Dato histórico", "info");
                                                                                     }
                                                                                     return;
                                                                                 }`
    );
}

// 2. Inyectar icono Activity
content = content.replace(
    /\{isLocked && <Lock size=\{7\} className="text-white opacity-60" \/>\}/g,
    `{isLocked && <Lock size={7} className="text-white opacity-60" />}
                                                                                 {att && <Activity size={7} className="text-white opacity-80 animate-pulse" />}`
);

// 3. Reemplazar el Portal de Hover por el Modal de Snapshot (Centro de pantalla)
const oldPortalRegex = /\{\/\* Elite Detail Card Portal .* \n\s*\{hoveredShiftData && \([\s\S]*?\n\s*\}\n/g;
const newPortal = `{/* Elite Detail Snapshot Modal - Click Persistent */}
                    {showSnapshotModal && snapshotData && (
                        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1cb38a' : '#ffffff', width: '100%', maxWidth: '380px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.3s ease-out' }}>
                                <div className={\`p-8 pb-4 flex items-center justify-between \${snapshotData.att ? (snapshotData.att.status === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10') : 'bg-slate-50 dark:bg-slate-800/50'}\`}>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Consulta Biometría Elite</span>
                                        <span className={\`text-[15px] font-[1000] tracking-tight \${snapshotData.att ? (snapshotData.att.status === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') : 'text-slate-500'}\`}>
                                            {snapshotData.isDescanso ? 'Día de Descanso' : (snapshotData.att ? (snapshotData.att.status === 0 ? 'ASISTENCIA CORRECTA' : 'MARCACIÓN CON DESFASE') : 'SIN MARCACIONES')}
                                        </span>
                                    </div>
                                    <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center \${snapshotData.att ? (snapshotData.att.status === 0 ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-600' : 'bg-amber-100 dark:bg-amber-400/20 text-amber-600') : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}\`}>
                                        {snapshotData.att ? (snapshotData.att.status === 0 ? <CheckCircle size={24} /> : <AlertCircle size={24} />) : <Clock size={24} />}
                                    </div>
                                </div>

                                <div className="p-8 pt-6 space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                            <Calendar size={20} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planificación de Turno</span>
                                            <span className="text-[14px] font-[1000] text-slate-800 dark:text-white tracking-tight">{snapshotData.shiftTime}</span>
                                        </div>
                                    </div>

                                    {!snapshotData.isDescanso && (
                                        <div className="grid grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <LogIn size={14} className="text-emerald-500" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registro In</span>
                                                </div>
                                                <span className="text-[16px] font-[1000] text-slate-800 dark:text-white tracking-tight">
                                                    {snapshotData.att ? new Date(snapshotData.att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <LogOut size={14} className="text-rose-500" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registro Out</span>
                                                </div>
                                                <span className="text-[16px] font-[1000] text-slate-800 dark:text-white tracking-tight">
                                                    {snapshotData.att && snapshotData.att.clockOut ? new Date(snapshotData.att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (snapshotData.att ? 'ACTIVO' : '--:--')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {snapshotData.att && snapshotData.att.statusObservation && (
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-100 dark:border-white/5 text-left shadow-inner">
                                            <div className="flex items-center gap-2 mb-2 text-slate-400">
                                                <Info size={12} />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Observaciones Biométricas</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold italic leading-relaxed">
                                                "\${snapshotData.att.statusObservation}"
                                            </p>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setShowSnapshotModal(false)}
                                        style={{ width: '100%', padding: '18px', borderRadius: '22px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.3)', marginTop: '10px' }}
                                    > Entendido </button>
                                </div>
                            </div>
                        </div>
                    )}`;

content = content.replace(oldPortalRegex, newPortal);

fs.writeFileSync(filePath, content);
console.log('SnapShot V12 Applied Successfully.');
