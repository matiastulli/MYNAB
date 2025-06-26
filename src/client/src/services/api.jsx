const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mynab-service.up.railway.app';

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

      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        headers: getHeaders(),
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
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
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
  
  put: async (endpoint, data) => {
    try {
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: 'PUT',
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
  
  delete: async (endpoint) => {
    try {
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.detail || "Request failed" };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API delete error:", error);
      return { error: "Failed to process your request" };
    }
  },
  
  // Authentication specific methods
  auth: {
    signin: async (credentials) => {
      return api.post('auth/signin', credentials);
    },
    
    signup: async (userData) => {
      return api.post('auth/signup', userData);
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