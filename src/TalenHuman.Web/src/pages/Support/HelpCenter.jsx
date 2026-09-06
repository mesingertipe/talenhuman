import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Shared/Modal';

const HelpCenter = ({ user }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const isSupport = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Admin') || user?.roles?.includes('Soporte');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await api.get('/api/Faqs');
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      question: formData.get('question'),
      answer: formData.get('answer'),
      targetRoles: formData.get('targetRoles'),
      category: formData.get('category'),
      isActive: true,
      isSystem: editingFaq ? editingFaq.isSystem : false
    };

    try {
      if (editingFaq) {
        await api.put(`/api/Faqs/${editingFaq.id}`, { ...data, id: editingFaq.id });
      } else {
        await api.post('/api/Faqs', data);
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta pregunta frecuente?')) return;
    try {
      await api.delete(`/api/Faqs/${id}`);
      fetchFaqs();
    } catch (error) {
      alert('Error al eliminar FAQ. Puede que sea del sistema.');
    }
  };

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  if (loading) return <div className="text-slate-400">Cargando preguntas frecuentes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="text-indigo-400" /> Centro de Ayuda
        </h2>
        {isSupport && (
          <button 
            onClick={() => { setEditingFaq(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} /> Nueva Pregunta
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(groupedFaqs).map(([category, items]) => (
          <div key={category} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <h3 className="text-lg font-semibold text-indigo-300 mb-4">{category}</h3>
            <div className="space-y-3">
              {items.map(faq => (
                <div key={faq.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/80"
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  >
                    <span className="font-medium text-slate-200">{faq.question}</span>
                    <div className="flex items-center gap-3">
                      {isSupport && (
                        <div className="flex items-center gap-2 mr-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingFaq(faq); setIsModalOpen(true); }}
                            className="text-slate-400 hover:text-indigo-400 p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!faq.isSystem && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }}
                              className="text-slate-400 hover:text-red-400 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                      {expandedId === faq.id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                    </div>
                  </div>
                  {expandedId === faq.id && (
                    <div className="p-4 pt-0 text-slate-400 text-sm border-t border-slate-700/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFaq ? 'Editar FAQ' : 'Nueva FAQ'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
            <input name="category" defaultValue={editingFaq?.category || 'General'} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pregunta</label>
            <input name="question" defaultValue={editingFaq?.question} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Respuesta</label>
            <textarea name="answer" defaultValue={editingFaq?.answer} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Roles (CSV)</label>
            <input name="targetRoles" defaultValue={editingFaq?.targetRoles || 'Empleado,Gerente,Distrital,RH,Admin,SuperAdmin'} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required />
            <p className="text-xs text-slate-500 mt-1">Ej: Empleado,Gerente</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HelpCenter;
