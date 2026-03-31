const fs = require('fs');
const path = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. REEMPLAZO TOTAL DEL BLOQUE DE CELDAS (days.map)
// Buscamos desde el inicio del map hasta el final del td.
const startAnchor = '{days.map((day, di) => {';
const startIndex = content.indexOf(startAnchor);

// Buscamos el final de la celda de la cuadrícula (el td que cierra)
// Usamos un marcador posterior para asegurar que capturamos todo el bloque
const endAnchor = '</td>';
// Pero hay muchos </td>, necesitamos el que cierra el map.
// El map termina en 1155 mas o menos segun el view_file anterior.
// El siguiente bloque es el cierre de la fila </tr>.

const newGridBlock = `{days.map((day, di) => {
                                                    const dayShifts = shifts.filter(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === day.toDateString());
                                                    const nov = getNovedad(emp.id, day);
                                                    const isLockedDay = new Date(day) < new Date(new Date().setHours(0,0,0,0));

                                                    return (
                                                        <td
                                                            key={di}
                                                            onDragOver={e => e.preventDefault()}
                                                            onDrop={e => handleDropOnGrid(e, emp.id, day)}
                                                            className="p-1 border-r dark:border-slate-800"
                                                        >
                                                            <div className="flex flex-col gap-1 min-h-[96px] justify-center">
                                                                {nov && (
                                                                    <div onClick={() => { setSelectedNov({ ...nov, empName: \`\${emp.firstName} \${emp.lastName}\` }); setShowNovModal(true); }}
                                                                         className="rounded-2xl h-12 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 shrink-0">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 leading-none">NOVEDAD</span>
                                                                        <div className="h-4 w-4 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-500">
                                                                            <Info size={10} strokeWidth={3} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {dayShifts.map((shift, si) => {
                                                                    const att = attendances.find(a => String(a.shiftId) === String(shift.id) && shift.id);
                                                                    let bgColor = '#4f46e5';
                                                                    
                                                                    if (att) {
                                                                        if (att.status === 0) bgColor = '#10b981';
                                                                        else if (att.status === 1) bgColor = '#f59e0b';
                                                                        else if (att.status === 3) bgColor = '#ef4444';
                                                                        else bgColor = '#f97316';
                                                                    } else if (!shift.isDescanso && !shift.isFuera && new Date(shift.startTime) < new Date()) {
                                                                        bgColor = '#ef4444';
                                                                    }

                                                                    if (shift.isDescanso) bgColor = '#94a3b8';
                                                                    if (shift.isFuera) bgColor = '#8b5cf6';

                                                                    const shiftTime = \`\${new Date(shift.startTime).getHours().toString().padStart(2, '0')}:\${new Date(shift.startTime).getMinutes().toString().padStart(2, '0')}-\${new Date(shift.endTime).getHours().toString().padStart(2, '0')}:\${new Date(shift.endTime).getMinutes().toString().padStart(2, '0')}\`;
                                                                    const attTime = att ? \`\${new Date(att.clockIn).getHours().toString().padStart(2, '0')}:\${new Date(att.clockIn).getMinutes().toString().padStart(2, '0')}—\${att.clockOut ? new Date(att.clockOut).getHours().toString().padStart(2, '0') + ':' + new Date(att.clockOut).getMinutes().toString().padStart(2, '0') : '...'}\` : 'S/MARCAR';
                                                                    const displayText = viewMode === 'SHIFTS' ? (shift.isDescanso ? 'REST' : shiftTime) : (shift.isDescanso ? 'REST' : attTime);
                                                                    const isLocked = !!att || isLockedDay;
                                                                     
                                                                     return (
                                                                         <div key={si} 
                                                                              draggable={!isLocked} 
                                                                              onDragStart={e => {
                                                                                  if (isLocked) { e.preventDefault(); return; }
                                                                                  handleDragStart(e, 'GRID', { employeeId: emp.id, date: day, shiftId: shift.id });
                                                                              }}
                                                                              onClick={() => {
                                                                                  if (isLocked) {
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
                                                                                 setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                                                                              }}
                                                                              onMouseLeave={() => setHoveredShiftData(null)}
                                                                              className={\`group rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative \${isLocked ? (att ? 'cursor-help hover:ring-2 ring-white/50 scale-105' : 'cursor-default opacity-[0.9]') : 'cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50'}\`}
                                                                              style={{ background: bgColor, minWidth: '85px', minHeight: '42px', filter: isLocked ? 'contrast(0.9) saturate(0.8)' : 'none' }}
                                                                         >
                                                                             <div className="flex items-center gap-2 mb-0.5">
                                                                                 {isLocked && <Lock size={11} className="text-white opacity-70" />}
                                                                                 {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />}
                                                                                 <span className="text-[7px] font-black uppercase tracking-[0.1em] opacity-80 leading-none">
                                                                                    {viewMode === 'SHIFTS' ? (shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO') : 'MARCACIÓN'}
                                                                                 </span>
                                                                             </div>
                                                                             <span className={\`text-[8px] font-[1000] tracking-tighter whitespace-nowrap mt-0.5 \${viewMode === 'ATTENDANCE' && !att ? 'opacity-40 animate-pulse' : ''}\`}>
                                                                                 {displayText}
                                                                             </span>
                                                                             
                                                                             {att && (
                                                                                 <div className={\`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 \${att.status === 0 ? 'bg-emerald-400' : 'bg-rose-400'} flex items-center justify-center shadow-md animate-bounce\`}>
                                                                                     {att.status === 0 ? <CheckCircle size={8} /> : <AlertCircle size={8} />}
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     );
                                                                 })}
                                                                {!nov && dayShifts.length === 0 && (
                                                                    <div onClick={() => {
                                                                                 if (isLockedDay) {
                                                                                     showToast("Turno bloqueado: Dato histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 setPendingEvent({ employeeId: emp.id, date: day, type: 'Turno', existingShift: null });
                                                                                 setStartTime('08:00');
                                                                                 setEndTime('17:00');
                                                                                 setShowTimeModal(true);
                                                                             }} 
                                                                             className={\`h-12 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all \${isLockedDay ? 'border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-[0.4]' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer group'}\`}
                                                                    >
                                                                        <Plus size={16} className={\`\${isLockedDay ? 'text-slate-300' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-125'} transition-all\`} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}`;

// Buscamos el final del bloque dias (el cierre del )} de days.map)
// El td termina en 1155 mas o menos. El siguiente elemento es el cierre del map.
const mapSnippetTail = '})}'; 
// Pero necesitamos asegurarnos de que es el correcto.
// Vamos a buscar la secuencia de cierre: </td> \n ); \n })}
const blockClosingPattern = /<\/td>\s*\);\s*\}\)\}/;
const match = blockClosingPattern.exec(content);

if (startIndex !== -1 && match) {
    const endIndex = match.index + match[0].length;
    const finalContent = content.substring(0, startIndex) + newGridBlock + content.substring(endIndex);
    fs.writeFileSync(path, finalContent);
    console.log('Elite V12 Grid Rescue Applied Successfully.');
} else {
    console.error('Could not find the grid block anchors.');
    process.exit(1);
}
