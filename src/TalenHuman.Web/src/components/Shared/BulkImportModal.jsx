import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Activity, ChevronRight, List } from 'lucide-react';
import api from '../../services/api';

const BulkImportModal = ({ isOpen, onClose, type, onComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setResult(null);
    setStep(1);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/import/template/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Plantilla_${type}_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando plantilla', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setResult(null);
      setStep(1);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/import/validate/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Error al validar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData || previewData.hasErrors) return;
    setLoading(true);

    try {
      const res = await api.post(`/import/confirm/${type}`, previewData.rows);
      setResult(res.data);
      setStep(3);
      if (onComplete && res.data.successCount > 0) onComplete();
    } catch (err) {
      console.error(err);
      alert("Error al confirmar la carga");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'brands': return 'Importar Marcas';
      case 'stores': return 'Importar Tiendas';
      case 'profiles': return 'Importar Cargos';
      case 'employees': return 'Importar Empleados';
      default: return 'Carga Masiva';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 items-start">
        <div className="w-8 h-8 min-w-[32px] rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm border border-slate-200 text-indigo-600">1</div>
        <div style={{ flex: 1 }}>
          <p className="font-bold text-sm text-slate-800">Obtén el Formato Parametrizado</p>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">Descarga la plantilla Excel con datos de referencia actualizados para {type}.</p>
          <button onClick={handleDownloadTemplate} className="btn-premium btn-premium-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Download size={16} /> Descargar Plantilla .xlsx
          </button>
        </div>
      </div>
      <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 items-start">
        <div className="w-8 h-8 min-w-[32px] rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm border border-slate-200 text-indigo-600">2</div>
        <div style={{ flex: 1 }}>
          <p className="font-bold text-sm text-slate-800">Cargar Archivo</p>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">Selecciona el archivo completado desde tu equipo.</p>
          <div className="relative">
            <input type="file" accept=".xlsx" onChange={handleFileChange} id="bulk-file-input" className="sr-only" />
            <label htmlFor="bulk-file-input" className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer text-sm font-semibold text-slate-600">
              <Upload size={16} /> {file ? file.name : 'Seleccionar Archivo...'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border ${previewData.hasErrors ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
        <div className="flex items-center gap-2 font-bold mb-2">
          {previewData.hasErrors ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {previewData.hasErrors ? 'Se encontraron errores en los datos' : 'Validación exitosa'}
        </div>
        <p className="text-sm">Total de filas procesadas: {previewData.rows.length}</p>
        {previewData.hasErrors && <p className="text-sm mt-1 font-semibold opacity-80">Por favor, corrige los errores o quita las filas marcadas para continuar.</p>}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="max-h-[250px] overflow-y-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Fila</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                {previewData.headers.map(h => <th key={h} className="px-4 py-3 font-semibold text-slate-600">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewData.rows.map(row => (
                <tr key={row.rowNumber} className={row.hasErrors ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-2 font-medium text-slate-500 border-r border-slate-100/50">{row.rowNumber}</td>
                  <td className="px-4 py-2 border-r border-slate-100/50">
                    {row.hasErrors ? (
                      <div className="flex items-center gap-1 text-red-600 text-[11px] font-bold uppercase tracking-wide cursor-help" title={row.errors.map(e => `${e.field}: ${e.message}`).join('\n')}>
                        <AlertCircle size={14} /> Falla ({row.errors.length})
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold uppercase tracking-wide">
                        <CheckCircle size={14} /> OK
                      </div>
                    )}
                  </td>
                  {previewData.headers.map(h => (
                    <td key={h} className="px-4 py-2">
                      <div className="truncate max-w-[140px]" title={row.data[h]}>{row.data[h]}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={`p-6 rounded-2xl border ${result.errorCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
      <div className="flex items-center justify-center gap-3 font-bold text-lg mb-4">
        {result.errorCount > 0 ? <AlertCircle size={28} className="text-amber-500" /> : <CheckCircle size={28} className="text-emerald-500" />}
        Proceso Completado
      </div>
      <div className="space-y-2 text-center">
        <p className="text-sm">Registros creados exitosamente: <span className="font-bold text-emerald-700 text-lg">{result.successCount}</span></p>
        <p className="text-sm">Registros con error: <span className="font-bold text-amber-700 text-lg">{result.errorCount}</span></p>
      </div>
      {result.messages && result.messages.length > 0 && (
        <div className="mt-6 p-4 bg-white/60 rounded-xl text-xs max-h-[150px] overflow-y-auto border border-black/5 text-left">
          <p className="font-bold uppercase tracking-wider text-[10px] mb-2 opacity-70">Detalle de Errores:</p>
          {result.messages.map((msg, i) => <p key={i} className="mb-1">• {msg}</p>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-in zoom-in duration-300" style={{ maxWidth: step === 2 ? '700px' : '540px', transition: 'max-width 0.3s' }}>
        <div className="modal-header">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ margin: 0 }}>
             <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <FileSpreadsheet className="text-indigo-600" size={22} />
             </div>
             {getTitle()}
          </h2>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="modal-body">
          {step === 1 && <p className="text-slate-500 text-sm mb-6">Optimiza tu tiempo verificando y cargando múltiples registros mediante Excel.</p>}
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="modal-footer flex justify-between">
          <div>
            {step === 2 && (
              <button disabled={loading} onClick={() => setStep(1)} className="btn-premium btn-premium-secondary mr-2">
                Atrás
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button disabled={loading} onClick={handleClose} className="btn-premium btn-premium-secondary">
              {step === 3 ? 'Cerrar' : 'Cancelar'}
            </button>
            {step === 1 && (
              <button disabled={!file || loading} onClick={handleValidate} className="btn-premium btn-premium-primary min-w-[160px]">
                {loading ? 'Validando...' : 'Validar Datos'} {!loading && <ChevronRight size={18} />}
              </button>
            )}
            {step === 2 && (
              <button disabled={previewData?.hasErrors || loading} onClick={handleConfirm} className="btn-premium btn-premium-primary min-w-[160px]">
                {loading ? 'Procesando...' : 'Confirmar Carga'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
