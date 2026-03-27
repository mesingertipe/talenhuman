import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Activity, ChevronRight, List } from 'lucide-react';
import api from '../../services/api';
import HelpIcon from './HelpIcon';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Paso 1 */}
      <div className="group flex gap-5 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 items-start hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
        <div className="w-10 h-10 min-w-[40px] rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/30">1</div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-widest leading-none">Paso 1: Obtener Plantilla</p>
            <HelpIcon text="Descarga el formato oficial de Excel configurado con las validaciones de datos para esta entidad" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed font-medium">Usa ExcelJS para generar una plantilla corporativa con dropdowns y guías de integración.</p>
          <button onClick={handleDownloadTemplate} className="btn-premium btn-premium-secondary group-hover:border-indigo-400 transition-colors" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem' }}>
            <Download size={16} className="text-indigo-500" /> Descargar Formato {type}.xlsx
          </button>
        </div>
      </div>

      {/* Paso 2 */}
      <div className="group flex gap-5 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 items-start hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
        <div className="w-10 h-10 min-w-[40px] rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/30">2</div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-widest leading-none">Paso 2: Cargar Información</p>
            <HelpIcon text="Sube el archivo .xlsx diligenciado. El sistema validará automáticamente la integridad de cada fila." />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">Sube el archivo completado para iniciar la validación técnica en tiempo real.</p>
          <div className="relative">
            <input type="file" accept=".xlsx" onChange={handleFileChange} id="bulk-file-input" className="sr-only" />
            <label htmlFor="bulk-file-input" className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group/label">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/label:bg-indigo-100 group-hover/label:text-indigo-600 transition-all">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{file ? file.name : 'Arrastra o selecciona un archivo'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Formato permitido: .xlsx</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div 
        className={`p-5 rounded-2xl border-2 flex items-center gap-4 ${previewData.hasErrors ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'}`}
        data-v12-tooltip={previewData.hasErrors ? 'Se encontraron inconsistencias. Revisa la tabla inferior.' : 'Todos los datos son válidos y listos para procesar.'}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${previewData.hasErrors ? 'bg-white text-amber-500 border border-amber-100' : 'bg-white text-emerald-500 border border-emerald-100'}`}>
          {previewData.hasErrors ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
        </div>
        <div style={{ flex: 1 }}>
          <p className="text-sm font-black uppercase tracking-widest">{previewData.hasErrors ? 'Revisión Requerida' : 'Validación Exitosa'}</p>
          <p className="text-xs font-bold opacity-70 mt-1">
            {previewData.hasErrors 
              ? `Se detectaron errores en ${previewData.rows.filter(r => r.hasErrors).length} filas. Por favor corrige el archivo y vuelve a cargarlo.`
              : 'El archivo cumple con todos los requisitos técnicos. Puedes proceder a confirmar el guardado.'}
          </p>
        </div>
        {previewData.hasErrors && (
          <div className="text-[10px] font-black bg-amber-200/50 px-3 py-1.5 rounded-lg uppercase tracking-widest">
            Corregir Errores
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300">
        <div className="max-h-[450px] overflow-auto custom-scrollbar bg-slate-50/30">
          <div 
            className="grid text-[12px]" 
            style={{ 
              width: 'max-content',
              gridTemplateColumns: `70px 180px repeat(${previewData.headers.length}, 250px)`
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-4 text-white font-black text-[10px] uppercase tracking-widest sticky top-0 left-0 z-50 flex items-center justify-center border-b border-r border-white/10"
              style={{ backgroundColor: '#0f172a', gridRow: 1, gridColumn: 1 }}
              data-v12-tooltip="Número de fila original"
            >
              #
            </div>
            <div 
              className="px-4 py-4 text-white font-black text-[10px] uppercase tracking-widest sticky top-0 z-50 flex items-center border-b border-r border-white/10"
              style={{ backgroundColor: '#0f172a', left: '70px', gridRow: 1, gridColumn: 2 }}
              data-v12-tooltip="Estado de validación"
            >
              Estado
            </div>
            {previewData.headers.map((h, i) => (
              <div 
                key={h} 
                className="px-4 py-4 text-white font-black text-[10px] uppercase tracking-widest sticky top-0 z-40 flex items-center truncate border-b border-r border-white/10"
                style={{ backgroundColor: '#0f172a', gridRow: 1, gridColumn: i + 3 }}
              >
                {h}
              </div>
            ))}

            {/* Rows */}
            {previewData.rows.map((row, idx) => {
              const bg = row.hasErrors ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
              const rowNum = idx + 2; // +2 because header is row 1
              return (
                <React.Fragment key={row.rowNumber}>
                  <div 
                    className="px-4 py-4 font-black text-slate-400 sticky left-0 z-30 flex items-center justify-center border-b border-r border-slate-200/60"
                    style={{ backgroundColor: bg, gridRow: rowNum, gridColumn: 1 }}
                  >
                    {row.rowNumber}
                  </div>
                  <div 
                    className="px-4 py-4 sticky z-30 flex items-center border-b border-r border-slate-200/60"
                    style={{ backgroundColor: bg, left: '70px', gridRow: rowNum, gridColumn: 2 }}
                  >
                    {row.hasErrors ? (
                      <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest cursor-help bg-red-100/60 px-2 py-1.5 rounded-lg w-fit shadow-sm border border-red-200/50 truncate" title={row.errors.map(e => `${e.field}: ${e.message}`).join('\n')}>
                        <AlertCircle size={12} className="animate-pulse flex-shrink-0" />
                        <span className="truncate">{row.errors.length} Error{row.errors.length > 1 ? 'es' : ''}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-100/60 px-2 py-1.5 rounded-lg w-fit shadow-sm border border-emerald-200/50">
                        <CheckCircle size={12} className="flex-shrink-0" />
                        <span>Correcto</span>
                      </div>
                    )}
                  </div>
                  {previewData.headers.map((h, i) => (
                    <div 
                      key={h} 
                      className="px-4 py-4 text-slate-600 font-semibold truncate flex items-center border-b border-r border-slate-200/60"
                      style={{ backgroundColor: bg, gridRow: rowNum, gridColumn: i + 3 }}
                      title={row.data[h]}
                    >
                      {row.data[h] || <span className="text-slate-300 italic font-normal">vacío</span>}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-in zoom-in-95 duration-500">
      <div className={`p-8 rounded-3xl border-2 flex flex-col items-center text-center ${result.errorCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/50 border-emerald-200 shadow-xl shadow-emerald-500/10'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl ${result.errorCount > 0 ? 'bg-white text-amber-500 shadow-amber-500/20' : 'bg-white text-emerald-500 shadow-emerald-500/20'}`}>
          {result.errorCount > 0 ? <AlertCircle size={40} className="animate-pulse" /> : <CheckCircle size={40} />}
        </div>
        
        <h3 className={`text-2xl font-black uppercase tracking-widest mb-2 ${result.errorCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
          {result.errorCount > 0 ? 'Proceso con Observaciones' : '¡Importación Exitosa!'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 max-w-sm">
          El sistema ha finalizado el procesamiento de los registros cargados para el módulo de {type}.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cargados</p>
            <p className="text-3xl font-black text-emerald-600">{result.successCount}</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Errores</p>
            <p className="text-3xl font-black text-amber-600">{result.errorCount}</p>
          </div>
        </div>

        {result.messages && result.messages.length > 0 && (
          <div className="w-full mt-8 text-left">
            <div className="flex items-center gap-2 mb-3">
              <List size={14} className="text-slate-400" />
              <p className="font-black uppercase tracking-widest text-[10px] text-slate-500">Detalles del Procesamiento</p>
            </div>
            <div className="p-5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-black/5 dark:border-white/5 text-[11px] max-h-[160px] overflow-y-auto custom-scrollbar font-medium text-slate-600 dark:text-slate-400 space-y-2">
              {result.messages.map((msg, i) => (
                <div key={i} className="flex gap-2 items-start py-1 border-b border-black/5 last:border-0">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <p>{msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
                {loading ? <div className="loader"></div> : (
                  <>
                    Validar Datos <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}
            {step === 2 && (
              <button disabled={previewData?.hasErrors || loading} onClick={handleConfirm} className="btn-premium btn-premium-primary min-w-[160px]">
                {loading ? <div className="loader"></div> : 'Confirmar Carga'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
