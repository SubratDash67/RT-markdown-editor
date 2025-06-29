const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isServerWaking = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.ok) {
        this.retryAttempts = 0;
        return response;
      }
      
      if (response.status === 503 || response.status === 502) {
        throw new Error('SERVER_WAKING');
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (error.message === 'SERVER_WAKING' || error.name === 'TypeError') {
        if (this.retryAttempts < this.maxRetries) {
          this.retryAttempts++;
          this.isServerWaking = true;
          
          await new Promise(resolve => setTimeout(resolve, 3000 * this.retryAttempts));
          return this.request(endpoint, options);
        }
      }
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    const response = await this.request(endpoint, { method: 'GET', ...options });
    return response.json();
  }

  async post(endpoint, data, options = {}) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
    return response.json();
  }

  async put(endpoint, data, options = {}) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
    return response.json();
  }

  async delete(endpoint, options = {}) {
    const response = await this.request(endpoint, { method: 'DELETE', ...options });
    return response.json();
  }

  getWebSocketUrl() {
    return WS_URL;
  }

  isWaking() {
    return this.isServerWaking;
  }
}

export const apiClient = new ApiClient();
