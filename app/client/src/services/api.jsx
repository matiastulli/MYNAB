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

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb);

const attemptRefresh = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => addRefreshSubscriber(resolve));
  }
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    onRefreshed(data.access_token);
    return data.access_token;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
};

const handleUnauthorized = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  window.location.href = '/';
};

export const api = {
  get: async (endpoint) => {
    try {
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await attemptRefresh();
          if (!newToken) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          const retryResponse = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
            headers: { ...getHeaders(), Authorization: `Bearer ${newToken}` },
            credentials: 'include',
          });
          if (retryResponse.status === 401) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          if (!retryResponse.ok) {
            const error = await retryResponse.json();
            return { error: error.error || 'API request failed' };
          }
          return retryResponse.json();
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

  post: async (endpoint, data, options = {}) => {
    try {
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

      let url = `${API_BASE_URL}${normalizedEndpoint}`;

      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.keys(options.params).forEach(key => {
          searchParams.append(key, options.params[key]);
        });
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await attemptRefresh();
          if (!newToken) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: { ...getHeaders(), Authorization: `Bearer ${newToken}` },
            body: data ? JSON.stringify(data) : undefined,
            credentials: 'include',
          });
          if (retryResponse.status === 401) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          if (!retryResponse.ok) {
            const error = await retryResponse.json();
            return { error: error.detail || error.error || 'API request failed' };
          }
          return retryResponse.json();
        }
        const error = await response.json();
        return { error: error.detail || error.error || 'API request failed' };
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },

  put: async (endpoint, data) => {
    try {
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await attemptRefresh();
          if (!newToken) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          const retryResponse = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
            method: 'PUT',
            headers: { ...getHeaders(), Authorization: `Bearer ${newToken}` },
            body: JSON.stringify(data),
            credentials: 'include',
          });
          if (retryResponse.status === 401) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          if (!retryResponse.ok) {
            const error = await retryResponse.json();
            return { error: error.error || 'API request failed' };
          }
          return retryResponse.json();
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
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await attemptRefresh();
          if (!newToken) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          const retryResponse = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
            method: 'DELETE',
            headers: { ...getHeaders(), Authorization: `Bearer ${newToken}` },
            credentials: 'include',
          });
          if (retryResponse.status === 401) {
            handleUnauthorized();
            return { error: 'Session expired' };
          }
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            return { error: errorData.detail || "Request failed" };
          }
          return retryResponse.json();
        }
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
    },

    // Passwordless authentication methods
    passwordless: {
      sendCode: async (email, codeType) => {
        return api.post('auth/passwordless/send-code', {
          email,
          code_type: codeType
        });
      },

      verifyCode: async (email, code, codeType) => {
        return api.post('auth/passwordless/verify-code', {
          email,
          verification_code: code,
          code_type: codeType
        });
      },

      register: async (userData, verificationCode) => {
        return api.post('auth/passwordless/register', { ...userData, verification_code: verificationCode });
      },

      login: async (email, verificationCode) => {
        return api.post('auth/passwordless/login', { email, verification_code: verificationCode });
      }
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
