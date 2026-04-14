import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Filter, CheckCircle, AlertCircle, Search, 
  FileSpreadsheet, Calendar, TrendingUp, BarChart3, Store as StoreIcon,
  Download, RefreshCw, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import PermissionGuard from '../../components/Shared/PermissionGuard';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const SalesData = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.05)',
  };

  const [sales, setSales] = useState([]);
  const [channels, setChannels] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    storeId: '',
    channelId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [filters, currentPage, itemsPerPage]);

  const fetchMetadata = async () => {
    try {
      const [channelsRes, storesRes] = await Promise.all([
        api.get('/sales/channels'),
        api.get('/stores')
      ]);
      setChannels(channelsRes.data);
      setStores(storesRes.data.map(s => ({ id: s.id, name: `${s.externalId} - ${s.name}` })));
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      if (filters.storeId) queryParams.append('storeId', filters.storeId);
      if (filters.channelId) queryParams.append('channelId', filters.channelId);

      const res = await api.get(`/sales?${queryParams.toString()}`);
      setSales(res.data.items || []);
      setTotalItems(res.data.totalCount || 0);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('es-CO', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      // Fetch data without pagination for export (limited to 1000 for safety)
      const queryParams = new URLSearchParams({
        pageNumber: 1,
        pageSize: 1000,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      if (filters.storeId) queryParams.append('storeId', filters.storeId);
      if (filters.channelId) queryParams.append('channelId', filters.channelId);

      const res = await api.get(`/sales?${queryParams.toString()}`);
      const dataToExport = (res.data.items || []).map(r => ({
        'Tienda/Local': r.storeName,
        'Fecha/Hora': new Date(r.recordDate).toLocaleString('es-CO'),
        'Canal': r.canal || 'GENERAL',
        'Venta Neta': r.ventaNeta,
        'Tickets': r.cantidadTickets,
        'Comensales': r.comensales,
        'Ticket Promedio': r.ticketPromedio
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas Maestras");
      XLSX.writeFile(wb, `Ventas_Maestras_${filters.startDate}_al_${filters.endDate}.xlsx`);
      showToast("Reporte generado exitosamente");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Error al exportar registros", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>Ventas Maestras</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '1rem', fontWeight: '600', marginTop: '6px' }}>Consolidación y analítica de ingresos operativos multi-canal</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <PermissionGuard module="SALES:SALES_DATA" action="Export" user={user}>
            <button 
              onClick={handleExportExcel}
              disabled={isExporting}
              className="btn-premium btn-premium-secondary" 
              style={{ borderRadius: '18px', padding: '0 24px', height: '56px' }}
            >
              {isExporting ? <div className="loader mr-2"></div> : <Download size={20} />} 
              {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
          </PermissionGuard>
          <PermissionGuard module="SALES:SALES_DATA" action="Create" user={user}>
            <button 
              onClick={() => setShowImport(true)}
              className="btn-premium btn-premium-primary"
              style={{ borderRadius: '18px', padding: '0 24px', height: '56px', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)' }}
            >
              <FileSpreadsheet size={20} /> Importar Excel
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="card" style={{ padding: '24px', borderRadius: '28px', marginBottom: '2.5rem', border: `1.5px solid ${activeColors.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2.5fr) minmax(200px, 2fr) minmax(150px, 1.5fr) minmax(150px, 1.5fr) auto', gap: '20px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: 1 }}>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Tienda / Sede</label>
            <SearchableSelect 
              options={[{id: '', name: 'TODAS LAS TIENDAS'}, ...stores]}
              value={filters.storeId}
              onChange={(val) => setFilters({...filters, storeId: val})}
              icon={StoreIcon}
              placeholder="Seleccionar sede..."
            />
          </div>

          <div style={{ flex: 1 }}>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Canal de Venta</label>
            <div className="relative group">
              <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
              <select 
                value={filters.channelId}
                onChange={(e) => setFilters({...filters, channelId: e.target.value})}
                className="w-full p-3.5 pl-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm appearance-none"
              >
                <option value="">TODOS LOS CANALES</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Fecha Inicial</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
              <input 
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full p-3.5 pl-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Fecha Final</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
              <input 
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full p-3.5 pl-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
              />
            </div>
          </div>

          <button 
            onClick={fetchSales}
            className="h-[52px] w-[52px] bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            title="Sincronizar Datos"
          >
            <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '50vh', position: 'relative' }}>
        {loading && sales.length === 0 ? (
          <div style={{ padding: '8rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="font-black text-indigo-900/40 uppercase tracking-widest text-xs">Consultando el Núcleo de Ventas...</p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(79, 70, 229, 0.02)', borderBottom: `1px solid ${activeColors.border}` }}>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Periodo / Tienda</th>
                  <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Canal</th>
                  <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Venta Neta</th>
                  <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Tickets</th>
                  <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Ticket Prom.</th>
                  <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Comensales</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {sales.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors" style={{ borderBottom: `1px solid ${activeColors.border}` }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="font-black text-slate-800 dark:text-white">{formatDate(item.recordDate)}</div>
                      <div style={{ fontSize: '0.7rem', color: activeColors.textMuted, fontWeight: '700' }} className="uppercase tracking-tight">
                        {item.storeName || `TIENDA ID: ${item.storeId}`}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ 
                        padding: '6px 14px', 
                        background: activeColors.accentSoft, 
                        color: activeColors.accent, 
                        borderRadius: '12px', 
                        fontSize: '10px', 
                        fontWeight: '950',
                        textTransform: 'uppercase'
                      }}>
                        {item.canal || 'GENERAL'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                      {formatCurrency(item.ventaNeta)}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '800' }}>
                      {item.cantidadTickets}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '700', color: activeColors.textMuted }}>
                      {formatCurrency(item.ticketPromedio)}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontWeight: '700' }}>
                      <div className="flex items-center justify-end gap-2 text-indigo-500">
                        <TrendingUp size={14} />
                        {item.comensales || 0}
                      </div>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" style={{ padding: '6rem', textAlign: 'center' }}>
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <BarChart3 size={64} />
                        <p className="font-black text-xl uppercase tracking-widest">Sin registros encontrados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Import Modal */}
      <BulkImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="sales" 
        onComplete={() => {
          showToast("Importación masiva exitosa");
          fetchSales();
        }} 
      />

      {/* Notification Toast */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesData;
