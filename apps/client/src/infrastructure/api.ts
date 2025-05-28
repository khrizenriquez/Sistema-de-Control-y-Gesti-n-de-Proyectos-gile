// Determinar la URL base de la API según el entorno
const BACKEND_URL = 'http://localhost:8000';  // URL directa al backend

// Cliente API basado en fetch
const api = {
  async get(endpoint: string, params?: Record<string, string>) {
    // Asegurar que endpoint comienza con /
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Solo añadir barra final si NO hay query parameters
    const endpointWithTrailingSlash = formattedEndpoint.includes('?') || formattedEndpoint.endsWith('/') 
      ? formattedEndpoint 
      : `${formattedEndpoint}/`;
    
    // Construir la URL completa con el BACKEND_URL + endpoint
    const fullPath = `${BACKEND_URL}${endpointWithTrailingSlash}`;
    
    let finalUrl: string;
    if (params) {
      // Construir URL con parámetros
      const urlObj = new URL(fullPath);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
      finalUrl = urlObj.toString();
    } else {
      // URL sin parámetros
      finalUrl = fullPath;
    }
    
    console.log(`API GET request to: ${finalUrl}`);
    const response = await callFetch(finalUrl, {
      method: 'GET',
    });
    
    return response;
  },
  
  async post(endpoint: string, data?: any) {
    // Asegurar que endpoint comienza con /
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Solo añadir barra final si NO hay query parameters
    const endpointWithTrailingSlash = formattedEndpoint.includes('?') || formattedEndpoint.endsWith('/') 
      ? formattedEndpoint 
      : `${formattedEndpoint}/`;
    
    // Construir la URL completa con el BACKEND_URL + endpoint
    const fullPath = `${BACKEND_URL}${endpointWithTrailingSlash}`;
    
    console.log(`API POST request to: ${fullPath}`, data);
    
    const response = await callFetch(fullPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response;
  },
  
  async put(endpoint: string, data?: any) {
    // Asegurar que endpoint comienza con /
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Solo añadir barra final si NO hay query parameters
    const endpointWithTrailingSlash = formattedEndpoint.includes('?') || formattedEndpoint.endsWith('/') 
      ? formattedEndpoint 
      : `${formattedEndpoint}/`;
    
    // Construir la URL completa con el BACKEND_URL + endpoint
    const fullPath = `${BACKEND_URL}${endpointWithTrailingSlash}`;
    
    console.log(`API PUT request to: ${fullPath}`, data);
    
    const response = await callFetch(fullPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response;
  },
  
  async delete(endpoint: string) {
    // Asegurar que endpoint comienza con /
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Solo añadir barra final si NO hay query parameters
    const endpointWithTrailingSlash = formattedEndpoint.includes('?') || formattedEndpoint.endsWith('/') 
      ? formattedEndpoint 
      : `${formattedEndpoint}/`;
    
    // Construir la URL completa con el BACKEND_URL + endpoint
    const fullPath = `${BACKEND_URL}${endpointWithTrailingSlash}`;
    
    console.log(`API DELETE request to: ${fullPath}`);
    
    const response = await callFetch(fullPath, {
      method: 'DELETE',
    });
    
    return response;
  }
};

// Función auxiliar que maneja la autenticación y errores comunes
async function callFetch(url: string, options: RequestInit = {}) {
  // Buscar token de autenticación en diferentes posibles lugares
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('supabase.auth.token') ||
                sessionStorage.getItem('authToken');
  
  if (token) {
    // Verificar si el token parece válido (al menos tiene forma de JWT)
    const isValidFormat = typeof token === 'string' && 
                         (token.startsWith('ey') || token.includes('.'));
    
    if (isValidFormat) {
      console.log(`Using authentication token (first 15 chars): ${token.substring(0, 15)}...`);
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    } else {
      console.error('Found token but it does not appear to be in JWT format:', 
                   typeof token === 'string' ? token.substring(0, 10) + '...' : typeof token);
    }
  } else {
    console.warn('⚠️ No authentication token found in localStorage or sessionStorage');
    // Buscar todas las claves en localStorage para depuración
    console.log('Available localStorage keys:', 
                Object.keys(localStorage).filter(key => key.includes('token') || 
                                                      key.includes('auth') || 
                                                      key.includes('user')));
  }
  
  try {
    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, options);
    
    // Manejar error de autenticación
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error:', response.status);
      
      // Solo limpiar localStorage y redirigir si es 401 (no autorizado)
      if (response.status === 401) {
        // Limpiar localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir a la página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    // Manejar otros errores
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    // Devolver data si hay contenido, o un objeto vacío si no
    const data = response.status !== 204 ? await response.json() : {};
    
    return { data, status: response.status };
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export { api };