import { getCurrentSession } from '../services/supabase';

/**
 * Adaptador para hacer peticiones a la API con autenticación
 */
export class ApiAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  }

  /**
   * Obtiene los headers para las peticiones autenticadas
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getCurrentSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  /**
   * Realiza una petición GET autenticada
   */
  async get<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error en petición GET: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Realiza una petición POST autenticada
   */
  async post<T>(path: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error en petición POST: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Realiza una petición PUT autenticada
   */
  async put<T>(path: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error en petición PUT: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Realiza una petición DELETE autenticada
   */
  async delete<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error en petición DELETE: ${response.statusText}`);
    }

    return response.json();
  }
} 