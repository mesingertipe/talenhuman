import { create } from '@github/webauthn-json';
import api from './api';

const SecurityService = {
  /**
   * Registra una nueva credencial biométrica (FaceID/Huella)
   */
  async registerBiometrics() {
    try {
      // 1. Obtener opciones del servidor
      const response = await api.post('/Security/register/options');
      const options = response.data;

      // 2. Crear credencial en el dispositivo
      const credential = await create(options);

      // 3. Enviar respuesta al servidor para validar y guardar
      const result = await api.post('/Security/register/complete', credential);
      return result.data;
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      throw error;
    }
  },

  /**
   * Actualiza el token de Firebase en el perfil del usuario
   */
  async updateFirebaseToken(token) {
    try {
      const response = await api.post('/Security/firebase/token', `"${token}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando token Firebase:', error);
      throw error;
    }
  }
};

export default SecurityService;
