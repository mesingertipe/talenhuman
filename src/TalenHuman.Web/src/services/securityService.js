import { create } from '@github/webauthn-json';
import api from './api';

const SecurityService = {
  /**
   * Obtiene las opciones de registro del servidor
   */
  async getRegistrationOptions() {
    try {
      const response = await api.post('/Security/register/options');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opciones biometría:', error);
      throw error;
    }
  },

  /**
   * Completa el proceso de registro enviando la credencial al servidor
   */
  async completeRegistration(credential) {
    try {
      const result = await api.post('/Security/register/complete', credential);
      return result.data;
    } catch (error) {
      console.error('Error completando biometría:', error);
      throw error;
    }
  },

  /**
   * Proceso legacy / simplificado (mantenemos compatibilidad)
   */
  async registerBiometrics() {
    try {
      const options = await this.getRegistrationOptions();
      const credential = await create({ publicKey: options });
      return await this.completeRegistration(credential);
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
