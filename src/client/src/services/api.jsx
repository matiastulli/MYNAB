const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

// Common headers with authentication
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        // Handle unauthorized or other errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          // Could also trigger a refresh token flow here
        }
        const error = await response.json();
        return { error: error.error || 'API request failed' };
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },
  
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        // Handle unauthorized or other errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
        }
        const error = await response.json();
        return { error: error.error || 'API request failed' };
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  }
};