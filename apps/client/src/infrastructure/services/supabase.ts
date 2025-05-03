import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  };
}

// Helper para obtener el usuario actual
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener usuario actual:', error.message);
    }
    return user;
  } catch (err) {
    console.error('Error inesperado al obtener usuario:', err);
    return null;
  }
};

// Helper para obtener la sesión actual
export const getCurrentSession = async () => {
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