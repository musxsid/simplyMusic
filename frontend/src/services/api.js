import axios from 'axios';
import keycloak from '../keycloak';

const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
});

api.interceptors.request.use(
  async (config) => {
    if (keycloak.token) {
      if (keycloak.isTokenExpired()) {
        try {
          await keycloak.updateToken(30);
        } catch (error) {
          console.error("Failed to refresh token", error);
          keycloak.login();
        }
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
