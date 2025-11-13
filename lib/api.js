import axios from 'axios';
import { getAuth } from 'firebase/auth';

/**
 * CLIENT PORTAL API CLIENT
 * 
 * SELF-CONTAINED: Only calls client portal's own routes (/api/*)
 * NO external API calls - everything is local
 */
const api = axios.create({
  // NO baseURL - all routes are relative to current origin (clientportal.ignitegrowth.biz)
  baseURL: '',
});

// Request interceptor - AUTOMATICALLY adds Firebase token to all requests
api.interceptors.request.use(
  async (config) => {
    // ALL routes are local - use current origin
    if (typeof window !== 'undefined') {
      config.baseURL = window.location.origin;
    } else {
      config.baseURL = '';
    }

    if (typeof window !== 'undefined') {
      try {
        // Get Firebase auth instance
        const firebaseAuth = getAuth();
        const user = firebaseAuth.currentUser;
        
        // If user is authenticated, add token to request
        if (user) {
          try {
            const token = await user.getIdToken(); // Firebase SDK gets fresh token automatically
            config.headers.Authorization = `Bearer ${token}`; // Automatically added!
          } catch (error) {
            console.error('❌ Failed to get Firebase token:', error);
          }
        }
      } catch (error) {
        // Firebase not initialized yet - skip token for now
        if (error.code !== 'app/no-app') {
          console.warn('Firebase auth not available:', error.message);
        }
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handles errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error for debugging
    if (error.config?.url?.startsWith('/api/')) {
      console.error('❌ Client Portal API Error:', {
        url: error.config.url,
        baseURL: error.config.baseURL,
        fullURL: error.config.url?.startsWith('http') 
          ? error.config.url 
          : `${error.config.baseURL || window.location.origin}${error.config.url}`,
        status: error.response?.status,
        message: error.message,
      });
    }

    // Handle 401 (Unauthorized) - token expired or invalid
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized - redirecting to login');
      // Clear any stored auth data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

