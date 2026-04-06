/**
 * UTILIDADES DE FORMATEO (V12.20)
 * Centraliza el formato de visualización para que sea dd/mm/yyyy en todo el proyecto.
 */

/**
 * Formatea una fecha a string dd/mm/yyyy
 * @param {Date|string} date - La fecha a formatear
 * @returns {string} - Fecha formateada o 'N/A'
 */
export const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'N/A';
    }
};

/**
 * Formatea una fecha para cabeceras cortas (ej: Mié 12)
 * @param {Date} date 
 * @returns {string}
 */
export const formatShortDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).toUpperCase();
};
