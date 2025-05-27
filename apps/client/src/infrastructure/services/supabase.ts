import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

console.log('🔥 Inicializando servicio de Supabase...');

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de diagnóstico (sin mostrar valores completos por seguridad)
console.log('🔑 Diagnóstico de variables de Supabase:');
console.log(`URL definida: ${typeof supabaseUrl === 'string' && supabaseUrl.length > 0 ? '✅' : '❌'}`);
if (supabaseUrl) {
  console.log(`URL válida (comienza con https://): ${supabaseUrl.startsWith('https://') ? '✅' : '❌'}`);
  console.log(`URL: ${supabaseUrl.substring(0, 8)}...${supabaseUrl.substring(supabaseUrl.length - 5)}`);
}

console.log(`Key definida: ${typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0 ? '✅' : '❌'}`);
if (supabaseAnonKey) {
  console.log(`Key longitud: ${supabaseAnonKey.length} caracteres`);
  console.log(`Key preview: ${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);
}

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR CRÍTICO: Faltan las variables de entorno para Supabase. Asegúrate de definir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
} else {
  console.log('✅ Variables de configuración de Supabase encontradas');
}

// Crear cliente de Supabase
let supabase: SupabaseClient;

try {
  // Verificar que tenemos valores válidos antes de crear el cliente
  if (supabaseUrl && supabaseUrl.startsWith('https://') && 
      supabaseAnonKey && supabaseAnonKey.length >= 10) {
    
    console.log('🔄 Creando cliente Supabase con credenciales válidas...');
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Almacenar la sesión en localStorage para persistencia
        storage: localStorage
      },
      global: {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    });
    
    console.log('✅ Cliente Supabase inicializado correctamente');
    
    // Verificar la conexión inmediatamente (sin bloquear)
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error al conectar con Supabase:', error.message);
        } else {
          console.log('✅ Conexión con Supabase establecida', { 
            sessionExists: !!data?.session 
          });
        }
      } catch (err) {
        console.error('❌ Error al verificar la conexión con Supabase:', err);
      }
    })();
  } else {
    throw new Error('Variables de entorno de Supabase inválidas. URL debe comenzar con https:// y la clave debe tener al menos 10 caracteres.');
  }
} catch (err) {
  console.error('❌ Error al inicializar el cliente de Supabase:', err);
  // Crear un cliente vacío que generará errores apropiados
  supabase = createClient('', '') as SupabaseClient;
}

// Exportar el cliente
export { supabase };

// Tipos para los datos de usuario
export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    name?: string; // Agregamos name para ser consistentes con lo que estamos usando
    full_name?: string; // Agregamos full_name para manejar datos existentes
    role?: string; // Agregamos role para roles de usuario
  };
}

// Helper para obtener el usuario actual
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener usuario actual:', error.message);
    }
    
    if (user) {
      // Asegurarse de guardar el token de acceso para uso con nuestra API
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('authToken', session.access_token);
      }
    }
    
    return user;
  } catch (err) {
    console.error('Error inesperado al obtener usuario:', err);
    return null;
  }
};

// Helper para obtener la sesión actual
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error al obtener la sesión actual:', error.message);
    }
    return session;
  } catch (err) {
    console.error('Error inesperado al obtener sesión:', err);
    return null;
  }
};

// Helper para verificar si el usuario está autenticado
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

// Refrescar token de autenticación
export const refreshSession = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error al refrescar sesión:', error.message);
      return { success: false, error: error.message };
    }
    
    if (!data.session) {
      return { success: false, error: 'No se pudo refrescar la sesión' };
    }
    
    console.log('✅ Sesión refrescada exitosamente');
    return { success: true };
  } catch (err: any) {
    console.error('Error inesperado al refrescar sesión:', err);
    return { success: false, error: err.message };
  }
};

// Cerrar sesión en todos los dispositivos
export const signOutFromAllDevices = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Error al cerrar sesión en todos los dispositivos:', error.message);
      return { success: false, error: error.message };
    }
    
    // Limpiar token en localStorage
    localStorage.removeItem('authToken');
    
    console.log('✅ Sesión cerrada en todos los dispositivos');
    return { success: true };
  } catch (err: any) {
    console.error('Error inesperado al cerrar sesión global:', err);
    return { success: false, error: err.message };
  }
};

// Configurar un listener para cambios en la sesión
export const setupSessionListener = (
  onAuthenticated: (session: Session) => void,
  onUnauthenticated: () => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        console.log('🔔 Evento de autenticación:', event);
        onAuthenticated(session);
      }
    } else if (event === 'SIGNED_OUT') {
      console.log('🔔 Usuario ha cerrado sesión');
      onUnauthenticated();
    }
  });
  
  // Devuelve la función para desuscribirse
  return () => {
    subscription.unsubscribe();
  };
}; 