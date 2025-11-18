/**
 * Cliente API para comunicación con el backend Django
 * Configurado para usar Session Authentication con cookies
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface FetchOptions extends RequestInit {
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Cliente HTTP personalizado para la API
 * Maneja automáticamente:
 * - Cookies de sesión (credentials: 'include')
 * - CSRF tokens
 * - Content-Type headers
 * - Errores de respuesta
 */
class ApiClient {
    
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtener el token CSRF desde el servidor
   */
  async fetchCsrfToken(): Promise<void> {
    try {
      console.log('🔐 Fetching CSRF token...');
      const response = await fetch(`${this.baseUrl}/security/csrf/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        console.log('✅ CSRF token received from server');
      }
      
      // También intentar obtener de la cookie como backup
      if (!this.csrfToken) {
        this.csrfToken = this.getCsrfTokenFromCookie();
        console.log('🔑 CSRF token from cookie:', this.csrfToken ? 'Found' : 'Not found');
      }
    } catch (error) {
      console.error('❌ Error fetching CSRF token:', error);
      // Intentar obtener de la cookie como fallback
      this.csrfToken = this.getCsrfTokenFromCookie();
    }
  }

  /**
     * Obtener el grupo activo del usuario autenticado
     */
    async getUserGroup(): Promise<{ group: string | null }> {
      return this.get<{ group: string | null }>("/security/user-group/");
    }

  /**
   * Obtener el token CSRF de las cookies
   */
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    
    return null;
  }

  /**
   * Realizar una petición HTTP
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { data, params, headers = {}, ...restOptions } = options;

    // Obtener CSRF token antes de peticiones que modifican datos
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(restOptions.method || 'GET');
    if (needsCsrf && !this.csrfToken) {
      await this.fetchCsrfToken();
    }

    // Construir URL con query parameters si existen
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const config: RequestInit = {
      ...restOptions,
      headers: {
        ...headers,
      },
      credentials: 'include', // Importante para cookies de sesión
    };

    // Solo establecer Content-Type si no es FormData
    // FormData establece automáticamente el boundary correcto
    if (!(data instanceof FormData)) {
      (config.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    // Agregar CSRF token si existe
    if (!this.csrfToken) {
      this.csrfToken = this.getCsrfTokenFromCookie();
    }
    
    if (needsCsrf && this.csrfToken && config.headers) {
      (config.headers as Record<string, string>)['X-CSRFToken'] = this.csrfToken;
      console.log('🔐 CSRF token added to request:', endpoint);
    } else if (needsCsrf && !this.csrfToken) {
      console.warn('⚠️ No CSRF token available for:', endpoint);
    }

    // Serializar datos si existen
    if (data) {
      if (data instanceof FormData) {
        // Si es FormData, enviarlo directamente
        config.body = data;
      } else {
        // Si es un objeto, serializarlo a JSON
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, config);

      // Si no hay contenido, retornar null
      if (response.status === 204) {
        return null as T;
      }

      // Verificar el tipo de contenido antes de parsear
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!isJson) {
        // Si no es JSON, el servidor está devolviendo HTML (probablemente error)
        const text = await response.text();
        throw {
          status: response.status,
          statusText: response.statusText,
          data: { 
            error: `El servidor devolvió ${contentType || 'contenido no JSON'}. ¿Está el servidor corriendo en ${this.baseUrl}?`,
            detail: text.substring(0, 200) 
          },
        };
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        };
      }

      return responseData as T;
    } catch (error: any) {
      // Si el error ya tiene el formato esperado, lanzarlo
      if (error.status && error.data) {
        throw error;
      }

      // Error de red u otro tipo de error
      throw {
        status: 0,
        statusText: 'Network Error',
        data: { error: error.message || 'Error de conexión con el servidor' },
      };
    }
  }

  /**
   * Métodos HTTP
   */
  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, data, method: 'POST' });
  }

  async put<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, data, method: 'PUT' });
  }

  async patch<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, data, method: 'PATCH' });
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instancia única del cliente API
export const apiClient = new ApiClient(API_URL);

// Exportar también la URL base
export { API_URL };
