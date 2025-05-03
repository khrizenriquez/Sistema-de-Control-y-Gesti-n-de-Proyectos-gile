import { User } from '../../domain/entities/User';
import { supabase, refreshSession, signOutFromAllDevices } from '../services/supabase';

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
      console.log('📝 AuthApiAdapter: Iniciando registro con Supabase para:', user.email);
      
      // Verificar que tenemos los datos necesarios
      if (!user.email || !user.password) {
        console.error('❌ Datos incompletos para registro');
        return { 
          success: false, 
          error: 'Email y contraseña son requeridos para el registro' 
        };
      }
      
      // Diagnóstico de las variables de Supabase antes de intentar registro
      const hasValidUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string' && 
                         import.meta.env.VITE_SUPABASE_URL.startsWith('https://');
      const hasValidKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' && 
                         import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10;
      
      console.log('Estado de variables para registro:');
      console.log('- URL válida:', hasValidUrl);
      console.log('- Key válida:', hasValidKey);
      
      if (!hasValidUrl || !hasValidKey) {
        console.error('Variables de Supabase no válidas. El registro probablemente fallará.');
      }
      
      // Intentar registro con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password || '',
        options: {
          data: {
            name: user.name || '',
            full_name: user.name || '',
            role: 'admin' // Asignar rol de admin por defecto en los metadatos
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      // Logging detallado de la respuesta para diagnóstico
      console.log('📌 Respuesta de Supabase:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? error.message : null 
      });

      if (error) {
        console.error('❌ Error de Supabase durante registro:', error.message);
        
        // Personalizar mensajes de error comunes para que sean más amigables
        if (error.message.includes('already registered')) {
          return { 
            success: false, 
            error: 'Este correo electrónico ya está registrado. Intenta iniciar sesión.' 
          };
        }
        
        if (error.message.includes('email') && error.message.includes('valid')) {
          return { 
            success: false, 
            error: 'Por favor ingresa una dirección de correo electrónico válida.' 
          };
        }
        
        if (error.message.includes('password')) {
          return { 
            success: false, 
            error: 'La contraseña debe tener al menos 6 caracteres.' 
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

      // Verificar si realmente tenemos datos de usuario
      if (!data || !data.user) {
        console.error('❌ Datos incompletos: No se recibió información del usuario');
        return { 
          success: false, 
          error: 'No se pudo crear el usuario. Por favor intenta nuevamente.' 
        };
      }

      // Registro exitoso, crear objeto de usuario
      const newUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || '',
        role: 'admin' // Asignar rol de admin por defecto
      };
      
      console.log('✅ Registro exitoso para:', newUser.email);
      
      // Si hay sesión, guardar token (Supabase puede configurarse para confirmar email antes)
      if (data.session?.access_token) {
        localStorage.setItem('authToken', data.session.access_token);
        console.log('🔑 Token JWT guardado para nuevo usuario');
        
        // Hacer una llamada a nuestra API para actualizar el rol a 'admin'
        try {
          // Acceder a la API con el token JWT ya almacenado
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/api/users/me/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({ role: 'admin' })
          });
          
          if (response.ok) {
            console.log('✅ Rol asignado como admin correctamente');
          } else {
            console.warn('⚠️ No se pudo asignar el rol de admin, pero el usuario fue creado');
          }
        } catch (apiError) {
          console.error('❌ Error al llamar a la API para asignar rol:', apiError);
          // No fallamos el registro por esto, ya que el usuario se creó correctamente
        }
      } else {
        console.log('📧 Registro requiere confirmación de email antes de iniciar sesión');
      }
      
      return { success: true, user: newUser };
    } catch (err: any) {
      console.error('❌ Error crítico en AuthApiAdapter.register:', err);
      return { 
        success: false, 
        error: `Error inesperado: ${err.message}. Verifica tu conexión y las credenciales de Supabase.`
      };
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

  async logoutFromAllDevices(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await signOutFromAllDevices();
      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async refreshAuthSession(): Promise<{ success: boolean; error?: string }> {
    try {
      return await refreshSession();
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
      name: user.user_metadata?.name || user.user_metadata?.full_name || ''
    };
  }

  // Verificar si existe una sesión activa válida
  async hasValidSession(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      return false;
    }
  }
} 