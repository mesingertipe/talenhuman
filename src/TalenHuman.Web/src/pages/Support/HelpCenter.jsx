import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Search, BookOpen, Layers } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Shared/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const HelpCenter = ({ user }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { isDarkMode, activeColors } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSupport = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Admin') || user?.roles?.includes('Soporte');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
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

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${activeColors.border}`, borderTopColor: activeColors.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '15px', color: activeColors.textMuted, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando base de conocimiento...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Premium Header */}
      <div style={{ background: isDarkMode ? `linear-gradient(135deg, ${activeColors.card} 0%, rgba(30, 41, 59, 0.4) 100%)` : `linear-gradient(135deg, ${activeColors.card} 0%, #f1f5f9 100%)`, borderRadius: '32px', padding: isMobile ? '30px 20px' : '50px 60px', marginBottom: '40px', border: `1px solid ${activeColors.border}`, boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.2)' : '0 20px 40px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: activeColors.accent, filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: activeColors.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                <BookOpen size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: '900', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '4px 12px', background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)', borderRadius: '100px' }}>Centro de Ayuda Elite</span>
            </div>
            
            <h1 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px 0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Base de<br/>Conocimiento</h1>
            <p style={{ color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '600', maxWidth: '400px', margin: 0, lineHeight: 1.6 }}>Encuentra respuestas rápidas a las preguntas más comunes sobre el uso de la plataforma TalenHuman V12.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '15px', width: isMobile ? '100%' : '350px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: activeColors.textMuted }} />
              <input 
                type="text" 
                placeholder="Buscar una pregunta..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 45px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'white', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', transition: 'all 0.3s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
              />
            </div>
            {isSupport && (
              <button 
                onClick={() => { setEditingFaq(null); setIsModalOpen(true); }}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)', transition: 'all 0.3s' }}
              >
                <Plus size={18} /> Nueva Pregunta
              </button>
            )}
          </div>
        </div>
      </div>

      {Object.keys(groupedFaqs).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: activeColors.card, borderRadius: '24px', border: `1px dashed ${activeColors.border}` }}>
          <Layers size={48} style={{ color: activeColors.textMuted, opacity: 0.3, margin: '0 auto 20px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: activeColors.textMain, marginBottom: '10px' }}>No se encontraron resultados</h3>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', maxWidth: '300px', margin: '0 auto' }}>Intenta con otras palabras clave o navega por las categorías disponibles.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {Object.entries(groupedFaqs).map(([category, items]) => (
            <div key={category} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingLeft: '10px' }}>
                <div style={{ width: '8px', height: '24px', background: activeColors.accent, borderRadius: '4px' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>{category}</h3>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, ${activeColors.border}, transparent)`, marginLeft: '10px' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {items.map(faq => {
                  const isExpanded = expandedId === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      style={{ background: activeColors.card, borderRadius: '20px', border: `1px solid ${isExpanded ? activeColors.accent : activeColors.border}`, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', boxShadow: isExpanded ? '0 15px 30px rgba(0,0,0,0.08)' : '0 4px 10px rgba(0,0,0,0.02)', transform: isExpanded ? 'translateY(-2px)' : 'none' }}
                    >
                      <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? (isDarkMode ? 'rgba(79, 70, 229, 0.05)' : 'rgba(79, 70, 229, 0.02)') : 'transparent' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: isExpanded ? activeColors.accent : activeColors.textMain, lineHeight: 1.4, paddingRight: '20px' }}>{faq.question}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          {isSupport && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isExpanded ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingFaq(faq); setIsModalOpen(true); }}
                                style={{ background: 'transparent', border: 'none', color: activeColors.textMuted, cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(79,70,229,0.1)'; e.currentTarget.style.color = activeColors.accent; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeColors.textMuted; }}
                              >
                                <Edit2 size={16} />
                              </button>
                              {!faq.isSystem && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }}
                                  style={{ background: 'transparent', border: 'none', color: activeColors.textMuted, cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = activeColors.textMuted; }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isExpanded ? activeColors.accent : (isDarkMode ? '#1e293b' : '#f1f5f9'), color: isExpanded ? 'white' : activeColors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>
                      <div style={{ maxHeight: isExpanded ? '500px' : '0', opacity: isExpanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        <div style={{ padding: '0 25px 25px 25px', borderTop: isExpanded ? `1px dashed ${activeColors.border}` : 'none', marginTop: isExpanded ? '15px' : '0', paddingTop: isExpanded ? '20px' : '0' }}>
                          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', lineHeight: 1.7, margin: 0, fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                            {faq.answer}
                          </p>
                          {faq.isSystem && (
                            <div style={{ display: 'inline-block', marginTop: '15px', padding: '4px 10px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '6px', fontSize: '10px', fontWeight: '800', color: activeColors.textMuted, border: `1px solid ${activeColors.border}` }}>
                              Sistema V12
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFaq ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Categoría *</label>
            <input name="category" defaultValue={editingFaq?.category || 'General'} required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Pregunta *</label>
            <input name="question" defaultValue={editingFaq?.question} required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Respuesta *</label>
            <textarea name="answer" defaultValue={editingFaq?.answer} rows={5} required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Roles Destino (CSV) *</label>
            <input name="targetRoles" defaultValue={editingFaq?.targetRoles || 'Empleado,Gerente,Distrital,RH,Admin,SuperAdmin'} required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: activeColors.textMuted, fontWeight: '600' }}>Roles separados por comas. Ej: Empleado,Gerente</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${activeColors.border}` }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', color: activeColors.textMuted, border: 'none', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = activeColors.textMain} onMouseOut={(e) => e.currentTarget.style.color = activeColors.textMuted}>
              Cancelar
            </button>
            <button type="submit" style={{ padding: '12px 24px', borderRadius: '12px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '900', fontSize: '0.85rem', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.3)', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              Guardar Pregunta
            </button>
          </div>
        </form>
      </Modal>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default HelpCenter;
