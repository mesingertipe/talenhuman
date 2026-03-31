const fs = require('fs');
const filePath = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inyectar Lógica de Flip de Posición (Arriba/Abajo) y Opacidad Directa
const portalStyleRegex = /style=\{\{\s*left:\s*\`\{\s*hoverPos\.x\s*\}px\`,\s*top:\s*\`\{\s*hoverPos\.y\s*\}px\`,\s*transform:\s*'translate\(-50%,\s*-100%\)\s*translateY\(-25px\)'\s*\}\}/g;

content = content.replace(portalStyleRegex, 
    `style={{ 
                                left: \`\${hoverPos.x}px\`, 
                                top: \`\${hoverPos.y}px\`, 
                                transform: hoverPos.y < 350 ? 'translate(-50%, 10px)' : 'translate(-50%, -100%) translateY(-25px)',
                                opacity: hoveredShiftData ? 1 : 0,
                                transition: 'opacity 0.15s ease-out, transform 0.1s ease-out'
                            }}`
);

// 2. Eliminar animaciones Tailwind problemáticas
content = content.replace(
    /className="fixed pointer-events-none z-\[1000000\] animate-in zoom-in-95 fade-in duration-300"/g,
    `className="fixed pointer-events-none z-[1000000]"`
);

fs.writeFileSync(filePath, content);
console.log('Elite Detail Card Rescued.');
