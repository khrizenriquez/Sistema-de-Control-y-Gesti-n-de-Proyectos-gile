import { User } from '../../domain/entities/User';
import { supabase } from '../services/supabase';

export class AuthApiAdapter {
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      console.log('📝 AuthApiAdapter: Iniciando login con Supabase para:', email);
      
      // Diagnóstico de las variables de Supabase antes de intentar login
      const hasValidUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string' && 
                         import.meta.env.VITE_SUPABASE_URL.startsWith('https://');
      const hasValidKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' && 
                         import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10;
      
      console.log('Estado de variables para autenticación:');
      console.log('- URL válida:', hasValidUrl);
      console.log('- Key válida:', hasValidKey);
      
      if (!hasValidUrl || !hasValidKey) {
        console.error('Variables de Supabase no válidas. La autenticación probablemente fallará.');
      }
      
      // Intentar autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Logging detallado de la respuesta para diagnóstico
      console.log('📌 Respuesta de Supabase:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? error.message : null 
      });

      // Si hay un error explícito, reportarlo
      if (error) {
        console.error('❌ Error de Supabase:', error.message);
        
        // Personalizar mensajes de error comunes para que sean más amigables
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Credenciales incorrectas. Verifica tu email y contraseña.' 
          };
        }
        
        if (error.message.includes('network')) {
          return { 
            success: false, 
            error: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      // Verificar si realmente tenemos datos de usuario y sesión
      if (!data || !data.user || !data.session) {
        console.error('❌ Datos incompletos: No se recibió usuario o sesión');
        return { 
          success: false, 
          error: 'Credenciales incorrectas o problema con la autenticación'
        };
      }

      // Autenticación exitosa, crear objeto de usuario
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || ''
      };
      
      console.log('✅ Login exitoso para:', user.email);
      
      // Guardar token en localStorage para uso posterior
      localStorage.setItem('authToken', data.session.access_token);
      
      // Log del token truncado para verificación (solo para diagnóstico)
      const tokenPreview = data.session.access_token.substring(0, 15) + '...';
      console.log('🔑 Token JWT guardado:', tokenPreview);
      
      return { success: true, user };
    } catch (err: any) {
      console.error('❌ Error crítico en AuthApiAdapter.login:', err);
      return { 
        success: false, 
        error: `Error inesperado: ${err.message}. Verifica tu conexión y las credenciales de Supabase.`
      };
    }
  }

  async register(user: User): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Implementar la función de registro
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password || '',
        options: {
          data: {
            name: user.name
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No se recibieron datos de usuario' };
      }

      const newUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || ''
      };

      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Limpiar token en localStorage
      localStorage.removeItem('authToken');
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || ''
    };
  }
} 