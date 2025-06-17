const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Hardcoded JWT token (for now)
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzUxMzk2NzAwLCJuYW1lIjoiSnVhbiBNYXRpYXMiLCJsYXN0X25hbWUiOiJUdWxsaSIsInRlbXBfYWNjZXNzIjoiZmFsc2UifQ.YA-U0ud_RK4L1SUjcdYeUv-nVEzxTYCcs0_3ui6y7Lk';

// Common headers with authentication
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`
});

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders()
    });
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },
};