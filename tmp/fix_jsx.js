const fs = require('fs');
const filePath = 'd:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.Web\\src\\pages\\Scheduling\\ShiftScheduler.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Match the block with flexible whitespace
const regex = /<div className="flex items-center gap-1">\s*\{isLocked && <Lock size=\{7\} className="text-white opacity-60" \/>\}\s*<span className="text-\[7px\] font-black uppercase tracking-\[0\.1em\] opacity-80 leading-none">\s*\{viewMode === 'SHIFTS' \? \(shift\.isDescanso \? 'DESC' : shift\.isFuera \? 'FUERA' : 'TURNO'\) : 'MARCACIÓN'\}\s*<\/span>\s*<span className=\{\`text-\[8px\]/g;

content = content.replace(regex, (match) => {
    // Insert </div> before the last span
    return match.replace('<span className={`text-[8px]', '</div>\n                                                                             <span className={`text-[8px]');
});

fs.writeFileSync(filePath, content);
console.log('JSX Fix applied.');
