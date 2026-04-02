import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const DebugPortal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(true);
    const [pwaEvent, setPwaEvent] = useState('Checking...');

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

        // PWA Event Detection
        const checkPWA = (e) => {
            setPwaEvent('Detected');
            console.log('PWA Event: beforeinstallprompt detected!');
        };
        window.addEventListener('beforeinstallprompt', checkPWA);

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            window.removeEventListener('beforeinstallprompt', checkPWA);
        };
    }, []);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-[30000] p-3 bg-slate-900 border-2 border-green-500 text-green-500 rounded-full shadow-2xl active:scale-90 transition-transform"
            >
                <Terminal size={24} />
            </button>
        );
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const hasBiometrics = !!window.PublicKeyCredential;

    return (
        <div className={`fixed left-0 right-0 z-[20000] bg-slate-900 text-slate-100 font-mono text-[10px] transition-all duration-300 shadow-2xl border-t border-slate-700 ${isMinimized ? 'bottom-0 h-12' : 'bottom-0 h-[70%]'}`}>
            <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700 h-10">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-green-400" />
                    <span className="font-bold text-xs uppercase tracking-tighter">V52 Diagnostic Hub</span>
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
                <div className="overflow-y-auto h-[calc(100%-40px)] p-2">
                    {/* HARDWARE OVERVIEW */}
                    <div className="grid grid-cols-2 gap-2 mb-4 border-b border-slate-800 pb-4">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 mb-0.5">PWA EVENT</p>
                            <p className={pwaEvent === 'Detected' ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>{pwaEvent}</p>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 mb-0.5">BIOMETRICS</p>
                            <p className={hasBiometrics ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>{hasBiometrics ? 'Supported' : 'No WebAuthn'}</p>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 mb-0.5">APP MODE</p>
                            <p className="text-indigo-400 font-bold">{isStandalone ? 'Standalone' : 'Browser'}</p>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 mb-0.5">BROWSER</p>
                            <p className="text-slate-400 font-bold truncate">{navigator.userAgent.split(' ').slice(-1)}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
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
                </div>
            )}
        </div>
    );
};

export default DebugPortal;
