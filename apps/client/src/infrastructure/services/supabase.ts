import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR CRÍTICO: Faltan las variables de entorno para Supabase. Asegúrate de definir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
} else {
  console.log('Configuración de Supabase cargada:', {
    url: supabaseUrl,
    keyValid: supabaseAnonKey.length > 20, // Solo verificamos que tenga una longitud razonable
  });
}

// Crear cliente de Supabase con manejo de errores más estricto
let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  console.log('Cliente de Supabase inicializado correctamente');

  // Verificar la conexión inmediatamente
  (async () => {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error al conectar con Supabase:', error.message);
      } else {
        console.log('Conexión con Supabase establecida correctamente');
      }
    } catch (err) {
      console.error('Error al verificar la conexión con Supabase:', err);
    }
  })();
} catch (err) {
  console.error('Error crítico al inicializar el cliente de Supabase:', err);
  // Crear un cliente dummy para evitar errores en el resto de la aplicación
  supabase = createClient('https://placeholder.supabase.co', 'placeholder') as SupabaseClient;
}

// Exportar el cliente (sea real o dummy)
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