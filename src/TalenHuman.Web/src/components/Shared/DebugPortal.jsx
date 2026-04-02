import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const DebugPortal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type, args) => {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            setLogs(prev => [{
                id: Date.now() + Math.random(),
                type,
                message,
                time: new Date().toLocaleTimeString()
            }, ...prev].slice(0, 50));
        };

        console.log = (...args) => {
            addLog('log', args);
            originalLog.apply(console, args);
        };
        console.error = (...args) => {
            addLog('error', args);
            originalError.apply(console, args);
        };
        console.warn = (...args) => {
            addLog('warn', args);
            originalWarn.apply(console, args);
        };

        // Capture Global Errors
        window.onerror = (msg, url, line, col, error) => {
            addLog('error', [`Global Error: ${msg} at ${line}:${col}`]);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 left-4 z-[20000] p-3 bg-slate-900/80 text-green-400 rounded-full shadow-lg backdrop-blur-md border border-green-500/30 active:scale-90 transition-transform"
            >
                <Terminal size={20} />
            </button>
        );
    }

    return (
        <div className={`fixed left-0 right-0 z-[20000] bg-slate-900 text-slate-100 font-mono text-[10px] transition-all duration-300 shadow-2xl border-t border-slate-700 ${isMinimized ? 'bottom-0 h-12' : 'bottom-0 h-1/2'}`}>
            <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700 h-10">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-400" />
                    <span className="font-bold text-xs">TALENHUMAN DEBUG</span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-[8px]">{logs.length} logs</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setLogs([])} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <Trash2 size={14} />
                    </button>
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-700 rounded text-red-400">
                        <X size={16} />
                    </button>
                </div>
            </div>
            
            {!isMinimized && (
                <div className="overflow-y-auto h-[calc(100%-40px)] p-2 space-y-1">
                    {logs.length === 0 && (
                        <div className="text-slate-500 text-center py-4 italic">No hay logs registrados...</div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} className={`border-b border-slate-800 pb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-slate-300'}`}>
                            <span className="text-slate-500 text-[8px] mr-2">[{log.time}]</span>
                            <span className="whitespace-pre-wrap break-all">{log.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DebugPortal;
