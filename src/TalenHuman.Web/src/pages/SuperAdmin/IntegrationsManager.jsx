import React, { useState, useEffect } from 'react';
import { 
    Key, Globe, Plus, Trash2, Save, 
    RefreshCw, CheckCircle, AlertCircle, ExternalLink,
    Building, Lock, Settings
} from 'lucide-react';
import api from '../../services/api';

const IntegrationsManager = ({ showToast }) => {
    const [apiKeys, setApiKeys] = useState([]);
    const [externalConfigs, setExternalConfigs] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // New API Key form state
    const [newKey, setNewKey] = useState({ companyId: '', description: '' });
    const [isAddingKey, setIsAddingKey] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [keysRes, configsRes, cosRes] = await Promise.all([
                api.get('/System/api-keys'),
                api.get('/System/external-configs'),
                api.get('/Companies')
            ]);
            setApiKeys(keysRes.data);
            setExternalConfigs(configsRes.data);
            setCompanies(cosRes.data);
        } catch (err) {
            showToast("Error loading integration data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKey.companyId || !newKey.description) {
            showToast("Please fill all fields", "error");
            return;
        }
        try {
            setSaving(true);
            await api.post('/System/api-keys', newKey);
            showToast("API Key created successfully");
            setNewKey({ companyId: '', description: '' });
            setIsAddingKey(false);
            fetchData();
        } catch (err) {
            showToast("Error creating API Key", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteKey = async (id) => {
        if (!window.confirm("Are you sure you want to delete this API Key?")) return;
        try {
            await api.delete(`/System/api-keys/${id}`);
            showToast("API Key deleted");
            fetchData();
        } catch (err) {
            showToast("Error deleting API Key", "error");
        }
    };

    const handleUpdateConfig = async (config) => {
        try {
            setSaving(true);
            await api.post('/System/external-configs', config);
            showToast("Integration config updated");
            fetchData();
        } catch (err) {
            showToast("Error updating config", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* API Keys Section */}
            <div className="card" style={{ padding: '2rem' }}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">API Keys (Push)</h3>
                            <p className="text-xs text-slate-400 font-bold">Secure tokens for external providers to push data</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsAddingKey(!isAddingKey)}
                        className="btn-premium btn-premium-primary"
                        style={{ height: '40px', padding: '0 20px', borderRadius: '12px' }}
                    >
                        {isAddingKey ? "Cancel" : <Plus size={16} />}
                    </button>
                </div>

                {isAddingKey && (
                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-4 border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Company</label>
                                <select 
                                    className="w-full p-3 rounded-xl border-slate-200"
                                    value={newKey.companyId}
                                    onChange={(e) => setNewKey({...newKey, companyId: e.target.value})}
                                >
                                    <option value="">Select Tenant...</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., POS Integration"
                                    className="w-full p-3 rounded-xl border-slate-200"
                                    value={newKey.description}
                                    onChange={(e) => setNewKey({...newKey, description: e.target.value})}
                                />
                            </div>
                        </div>
                        <button 
                            disabled={saving}
                            onClick={handleCreateKey}
                            className="w-full btn-premium btn-premium-primary py-3 rounded-xl shadow-lg shadow-indigo-200/50"
                        >
                            {saving ? "Generating..." : "Generate API Key ✨"}
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="pb-4">Company</th>
                                <th className="pb-4">Description</th>
                                <th className="pb-4">API Key</th>
                                <th className="pb-4">Created</th>
                                <th className="pb-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {apiKeys.map(k => (
                                <tr key={k.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Building size={14} className="text-slate-400" />
                                            <span className="font-bold text-slate-700 text-sm">{k.companyName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-xs font-bold text-slate-500">{k.description}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                                            <code className="text-xs font-mono text-indigo-600 font-black">{k.key}</code>
                                        </div>
                                    </td>
                                    <td className="py-4 text-[11px] text-slate-400 font-bold">
                                        {new Date(k.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteKey(k.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* External Sync Section */}
            <div className="card" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">External Adapters (Pull)</h3>
                        <p className="text-xs text-slate-400 font-bold">Automated synchronization from 3rd party APIs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {companies.map(cos => {
                        const config = externalConfigs.find(c => c.companyId === cos.id) || {
                            companyId: cos.id,
                            provider: 0, // FalconCloud
                            baseUrl: '',
                            username: '',
                            password: '',
                            enterpriseId: '',
                            serverNumber: '',
                            enableAutoSync: false,
                            syncIntervalMinutes: 60
                        };

                        return (
                            <div key={cos.id} className="p-6 border border-slate-100 rounded-2xl bg-white hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-500">
                                            {cos.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <h4 className="font-black text-slate-700">{cos.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {config.lastSyncAt && (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                Last Sync: {new Date(config.lastSyncAt).toLocaleString()}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.enableAutoSync ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {config.enableAutoSync ? 'Automatic' : 'Manual'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adapter Provider</label>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <img src="/falcon-logo.png" className="w-4 h-4 grayscale opacity-50" alt="" />
                                            Falcon Cloud (v5.2)
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base API URL</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 rounded-xl border-slate-200 text-sm font-mono"
                                            placeholder="https://falconcloud.co/site_SRV6_ph/site/api/service.php"
                                            defaultValue={config.baseUrl}
                                            onBlur={(e) => handleUpdateConfig({...config, baseUrl: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise ID</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 rounded-xl border-slate-200 text-sm"
                                            defaultValue={config.enterpriseId}
                                            onBlur={(e) => handleUpdateConfig({...config, enterpriseId: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Username</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 rounded-xl border-slate-200 text-sm"
                                            defaultValue={config.username}
                                            onBlur={(e) => handleUpdateConfig({...config, username: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Password</label>
                                        <input 
                                            type="password"
                                            className="w-full p-3 rounded-xl border-slate-200 text-sm"
                                            placeholder="••••••••"
                                            onBlur={(e) => handleUpdateConfig({...config, password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded text-indigo-600"
                                                defaultChecked={config.enableAutoSync}
                                                onChange={(e) => handleUpdateConfig({...config, enableAutoSync: e.target.checked})}
                                            />
                                            <span className="text-xs font-bold text-slate-500">Enable Automated Polling</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Frequency (min):</span>
                                            <input 
                                                type="number"
                                                className="w-16 p-1 text-xs rounded-lg border-slate-200 font-bold"
                                                defaultValue={config.syncIntervalMinutes}
                                                onBlur={(e) => handleUpdateConfig({...config, syncIntervalMinutes: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        className="text-indigo-600 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                        onClick={() => showToast("Manual sync triggered...")}
                                    >
                                        <RefreshCw size={12} /> Sync Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsManager;
