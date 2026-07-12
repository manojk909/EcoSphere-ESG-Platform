const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unexpected error occurred' }));
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint); }
  post<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  put<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  patch<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();
