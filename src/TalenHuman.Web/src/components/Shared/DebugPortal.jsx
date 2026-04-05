import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Terminal, X, Trash2, ChevronDown, ChevronUp, RefreshCw, Send, ShieldCheck, Zap } from 'lucide-react';
import { requestForToken } from '../../firebase';
import api from '../../services/api';

const DebugPortal = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [fcmToken, setFcmToken] = useState('Checking...');
    const [swStatus, setSwStatus] = useState('Detecting...');

    useEffect(() => {
        if (!isOpen) return;

        // 📝 CAPTURE CONSOLE
        const HUB_VERSION = "V65.1.17";
        const originalLog = console.log;
        const originalError = console.error;
        const addLog = (type, args) => {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            setLogs(prev => [{ id: Date.now() + Math.random(), type, message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
        };
        console.log = (...args) => { addLog('log', args); originalLog.apply(console, args); };
        console.error = (...args) => { addLog('error', args); originalError.apply(console, args); };

        // 🔔 DIAGNOSTICS (V63.8)
        const runDiagnostics = async () => {
            try {
                // Check Service Worker
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    setSwStatus(reg ? `Active (${reg.scope})` : 'Not Found');
                } else {
                    setSwStatus('Unsupported');
                }

                // Check Token
                const token = await requestForToken();
                setFcmToken(token || 'Failed to retrieve token');
            } catch (err) {
                setFcmToken(`Error: ${err.message}`);
            }
        };
        runDiagnostics();

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const forceSync = async () => {
        setFcmToken('Syncing...');
        const token = await requestForToken();
        setFcmToken(token || 'Sync Failed');
    };

    return createPortal(
        <div className={`fixed left-0 right-0 z-[1000000] bg-[#020617] text-slate-100 font-mono text-[10px] transition-all duration-300 shadow-2xl border-b border-slate-800 ${isMinimized ? 'top-0 h-10' : 'top-0 h-[75%]'}`}>
            <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 h-10">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Elite Diagnostic Hub V65.1.17</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={async () => {
                            if (window.confirm('¿Enviar prueba REAL desde la nube?')) {
                                try {
                                    const res = await api.post('/comunicados/test-fcm');
                                    alert('✅ Orden enviada a la nube: ' + (res.data?.message || 'OK'));
                                } catch (err) {
                                    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
                                    alert('❌ Error de nube: ' + errorMsg);
                                }
                            }
                        }} 
                        className="p-1 px-2 hover:bg-amber-500 bg-amber-600 rounded text-[8px] flex items-center gap-1 font-bold text-black"
                    >
                        <Zap size={10} /> PRUEBA REAL FCM
                    </button>
                    <button 
                        onClick={async () => {
                            if (window.confirm('¿LIMPIEZA PROFUNDA? (Borra caché, unregistra SW y recarga)')) {
                                try {
                                    // 1. Unregister SW
                                    if ('serviceWorker' in navigator) {
                                        const registrations = await navigator.serviceWorker.getRegistrations();
                                        for (let registration of registrations) {
                                            await registration.unregister();
                                        }
                                    }
                                    // 2. Clear Caches
                                    if ('caches' in window) {
                                        const keys = await caches.keys();
                                        for (let key of keys) {
                                            await caches.delete(key);
                                        }
                                    }
                                    // 3. Reload
                                    window.location.reload(true);
                                } catch (e) {
                                    window.location.reload();
                                }
                            }
                        }} 
                        className="p-1 px-2 hover:bg-red-500 bg-red-600 rounded text-[8px] flex items-center gap-1 font-bold text-white"
                    >
                        <RefreshCw size={10} /> FULL CACHE CLEAN
                    </button>
                    <button onClick={() => setLogs([])} className="p-1 hover:bg-slate-800 rounded"><Trash2 size={14} /></button>
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-slate-800 rounded">
                        {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-red-500"><X size={16} /></button>
                </div>
            </div>
            
            {!isMinimized && (
                <div className="overflow-y-auto h-[calc(100%-40px)] p-3">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <StatusBox label="FCM TOKEN" value={fcmToken} color={fcmToken.includes('Checking') ? 'amber' : 'green'} />
                        <StatusBox label="SW STATUS" value={swStatus} color={swStatus.includes('Active') ? 'blue' : 'red'} />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button onClick={forceSync} className="flex-1 bg-indigo-600 hover:bg-indigo-500 p-2 rounded flex items-center justify-center gap-2 font-bold uppercase text-[9px]">
                            <RefreshCw size={12} /> Re-Sync Token
                        </button>
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('simulate-fcm', { 
                                    detail: { 
                                        notification: { title: '🚀 Simulador V65.1', body: 'Si lees esto, el Toast funciona.' },
                                        data: { type: 'broadcast' }
                                    } 
                                }));
                            }} 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-2 rounded flex items-center justify-center gap-2 font-bold uppercase text-[9px]"
                        >
                            <Zap size={12} /> Simular Push
                        </button>
                    </div>

                    <div className="space-y-1">
                        {logs.map(log => (
                            <div key={log.id} className={`border-b border-white/5 pb-1 ${log.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
                                <span className="text-slate-500 mr-2">[{log.time}]</span>
                                <span className="break-all">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

const StatusBox = ({ label, value, color }) => (
    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
        <p className="text-[8px] text-slate-500 mb-0.5 font-black">{label}</p>
        <p className={`text-${color}-400 font-bold truncate`}>{value}</p>
    </div>
);

export default DebugPortal;
