import React, { useState, useRef, useEffect } from 'react';
import { 
    Bold, Italic, List, Image as ImageIcon, 
    Type, Loader2, Link2, X
} from 'lucide-react';
import api from '../../services/api';

const EliteRichEditor = ({ value, onChange, placeholder, isDarkMode, accentColor = '#6366f1' }) => {
    const editorRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b'
    };

    // Initialize content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current.focus();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 🌊 Reuse established S3 upload channel
            const response = await api.post('/Files/upload?folder=comunicados', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.url) {
                // Insert high-fidelity responsive image
                const imgHtml = `
                    <div style="margin: 20px 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1)">
                        <img src="${response.data.url}" alt="PR Image" style="width: 100%; height: auto; display: block;" />
                    </div>
                    <br/>
                `;
                execCommand('insertHTML', imgHtml);
            }
        } catch (error) {
            console.error("Image PR Upload Fail", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ 
            width: '100%', borderRadius: '24px', background: colors.card, 
            border: `2px solid ${colors.border}`, overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
            {/* 🛠️ ELITE TOOLBAR */}
            <div style={{ 
                padding: '12px 20px', borderBottom: `1px solid ${colors.border}`, 
                background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#fcfcfd',
                display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <ToolbarButton icon={<Bold size={18} />} onClick={() => execCommand('bold')} tooltip="Negrita" />
                <ToolbarButton icon={<Italic size={18} />} onClick={() => execCommand('italic')} tooltip="Cursiva" />
                <div style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }} />
                <ToolbarButton icon={<List size={18} />} onClick={() => execCommand('insertUnorderedList')} tooltip="Lista" />
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    padding: '10px', borderRadius: '12px', background: 'none', border: 'none', 
                    color: isUploading ? colors.textMuted : accentColor, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                  className="hover:bg-indigo-50"
                >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                    <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                        {isUploading ? 'Subiendo...' : 'Media Ocean'}
                    </span>
                </button>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                />
            </div>

            {/* ✍️ EDITABLE CANVAS */}
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                autoFocus
                placeholder={placeholder}
                style={{ 
                    padding: '24px 30px', minHeight: '300px', outline: 'none', 
                    color: colors.textMain, fontSize: '1rem', lineHeight: '1.7',
                    fontWeight: '500'
                }}
                className="prose-elite"
            />
            
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(placeholder);
                    color: #94a3b8;
                    cursor: text;
                }
                .prose-elite b, .prose-elite strong { font-weight: 800; color: #4f46e5; }
                .prose-elite ul { padding-left: 20px; list-style-type: square; }
                .prose-elite li { margin-bottom: 8px; }
            `}</style>
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, tooltip }) => (
    <button 
        type="button"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        onClick={onClick}
        title={tooltip}
        style={{ 
            width: '40px', height: '40px', borderRadius: '10px', border: 'none',
            background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
        }}
        className="hover:bg-slate-100 hover:text-indigo-600"
    >
        {icon}
    </button>
);

export default EliteRichEditor;
