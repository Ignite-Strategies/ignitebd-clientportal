import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://app.ignitegrowth.biz',
});

// Request interceptor - AUTOMATICALLY adds Firebase token to all requests
// Follows FIREBASE-AUTH-AND-USER-MANAGEMENT.md pattern
api.interceptors.request.use(
  async (config) => {
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

