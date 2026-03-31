const fs = require('fs');
const path = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Asegurar estados
if (!content.includes('const [hoveredShiftData, setHoveredShiftData]')) {
    content = content.replace(
        /const \[showSnapshotModal, setShowSnapshotModal\] = useState\(false\);/,
        `const [showSnapshotModal, setShowSnapshotModal] = useState(false);
    const [hoveredShiftData, setHoveredShiftData] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });`
    );
}

// 2. Aplicar lógica de Hover y Click en el Turno
// Queremos que al pasar el mouse salga la burbuja (hover) y al hacer click NO abra el modal viejo.
const oldShiftDiv = /<div\s+key=\{si\}\s+draggable=\{!isLocked\}[\s\S]*?onMouseLeave=\{\(\)\s*=>\s*setHoveredShiftData\(null\)\}/;
const newShiftDiv = `<div key={si} 
                                                                               draggable={!isLocked} 
                                                                               onDragStart={e => {
                                                                                   if (isLocked) { e.preventDefault(); return; }
                                                                                   handleDragStart(e, 'GRID', { employeeId: emp.id, date: day, shiftId: shift.id });
                                                                               }}
                                                                              onClick={() => {
                                                                                  if (isLocked) {
                                                                                      // Click redundant in hover mode, but we can show toast if no att
                                                                                      if (!att) showToast("Turno bloqueado: Dato histórico", "info");
                                                                                      return;
                                                                                  }
                                                                                  setPendingEvent({ employeeId: emp.id, date: day, type: shift.isDescanso ? 'Descanso' : shift.isFuera ? 'Turno Fuera' : 'Turno', existingShift: shift });
                                                                                  if (!shift.isDescanso && !shift.isFuera) {
                                                                                      const sd = new Date(shift.startTime);
                                                                                      const ed = new Date(shift.endTime);
                                                                                      setStartTime(\`\${String(sd.getHours()).padStart(2, '0')}:\${String(sd.getMinutes()).padStart(2, '0')}\`);
                                                                                      setEndTime(\`\${String(ed.getHours()).padStart(2, '0')}:\${String(ed.getMinutes()).padStart(2, '0')}\`);
                                                                                      setShowTimeModal(true);
                                                                                  }
                                                                              }}
                                                                              onMouseEnter={e => {
                                                                                 const rect = e.currentTarget.getBoundingClientRect();
                                                                                 setHoveredShiftData({ ...shift, att, shiftTime, attTime, isLocked });
                                                                                 // Centrar la burbuja sobre el turno
                                                                                 setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                                                                              }}
                                                                              onMouseLeave={() => setHoveredShiftData(null)}`;
content = content.replace(oldShiftDiv, newShiftDiv);

// 3. INDICADORES VISIBLES: Lock y Activity mas grandes
content = content.replace(/{isLocked && <Lock size=\{7\} className="text-white opacity-60" \/>}/, `<div className="flex items-center gap-2 mb-0.5">
                                                                                 {isLocked && <Lock size={11} className="text-white opacity-70" />}
                                                                                 {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />}`);

// 4. ELIMINAR MODAL VIEJO Y PONER BURBUJA (SPEECH BUBBLE)
const oldModalSection = /\{\/\* Elite Detail Snapshot Modal - Click Persistent \*\/\}[\s\S]*?\{showSnapshotModal && snapshotData && \([\s\S]*?<\/div>\s*\}\s*<\/div>\s*\}\s*\)/g;
const newBubbleSection = `{/* Elite SnapShot Bubble Tooltip (Fidelity Style) */}
                    {hoveredShiftData && (
                        <div 
                            className="no-print"
                            style={{ 
                                position: 'fixed', 
                                zIndex: 1000000, 
                                left: \`\${hoverPos.x}px\`, 
                                top: \`\${hoverPos.y}px\`, 
                                transform: hoverPos.y < 350 ? 'translate(-50%, 45px)' : 'translate(-50%, -100%) translateY(-25px)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                pointerEvents: 'none'
                            }}
                        >
                            {/* Card Container */}
                            <div style={{ 
                                background: isDarkMode ? '#1e293b' : '#ffffff', 
                                border: \`1px solid \${isDarkMode ? '#334155' : '#f1f5f9'}\`,
                                borderRadius: '32px',
                                padding: '16px 20px',
                                minWidth: '240px',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                                color: isDarkMode ? 'white' : '#1e293b',
                                position: 'relative'
                            }}>
                                {/* Header (Status) */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado Elite V12</span>
                                        <span className={\`text-[11px] font-[1000] tracking-tight \${hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-500'}\`}>
                                            {hoveredShiftData.att ? \`ASISTENCIA \${hoveredShiftData.att.status === 0 ? 'CORRECTA' : 'CON NOVEDAD'}\` : (hoveredShiftData.isDescanso ? 'DESCANSO' : 'PENDIENTE')}
                                        </span>
                                    </div>
                                    <div className={\`w-8 h-8 rounded-xl flex items-center justify-center \${hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500') : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}\`}>
                                        {hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? <CheckCircle size={16} /> : <AlertCircle size={16} />) : <Clock size={16} />}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-indigo-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black uppercase text-slate-400">Turno Plan</span>
                                            <span className="text-[12px] font-bold tracking-tight">{hoveredShiftData.shiftTime}</span>
                                        </div>
                                    </div>

                                    {!hoveredShiftData.isDescanso && (
                                        <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <LogIn size={11} className="text-emerald-500" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry</span>
                                                </div>
                                                <span className="text-[12px] font-[1000]">
                                                    {hoveredShiftData.att ? new Date(hoveredShiftData.att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </span>
                                            </div>
                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10"></div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <LogOut size={11} className="text-rose-500" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exit</span>
                                                </div>
                                                <span className="text-[12px] font-[1000]">
                                                    {hoveredShiftData.att && hoveredShiftData.att.clockOut ? new Date(hoveredShiftData.att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (hoveredShiftData.att ? 'ACTIVE' : '--:--')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* TRIANGULO (ARROW) */}
                                <div 
                                    className={\`absolute left-1/2 -translate-x-1/2 w-4 h-4 \${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rotate-45 border \${isDarkMode ? 'border-slate-700' : 'border-slate-100'}\`}
                                    style={{ 
                                        bottom: hoverPos.y < 350 ? 'auto' : '-8px',
                                        top: hoverPos.y < 350 ? '-8px' : 'auto',
                                        borderTop: hoverPos.y < 350 ? '' : 'none',
                                        borderLeft: hoverPos.y < 350 ? '' : 'none',
                                        borderBottom: hoverPos.y < 350 ? 'none' : '',
                                        borderRight: hoverPos.y < 350 ? 'none' : '',
                                        zIndex: -1
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}`;

content = content.replace(oldModalSection, newBubbleSection);

fs.writeFileSync(path, content);
console.log('Elite V12 SnapShot Bubble Applied Successfully.');
