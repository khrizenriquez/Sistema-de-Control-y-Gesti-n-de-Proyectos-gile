import { User } from '../../domain/entities/User';
import { supabase } from '../services/supabase';

export class AuthApiAdapter {
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error de login:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || ''
        };
        
        // Guardar token en localStorage para uso posterior
        localStorage.setItem('authToken', data.session.access_token);
        
        return { success: true, user };
      }

      return { success: false, error: 'No se pudo iniciar sesión' };
    } catch (err: any) {
      console.error('Error inesperado en login:', err.message);
      return { success: false, error: 'Error inesperado durante el login' };
    }
  }

  async register(user: User): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password || '',
        options: {
          data: {
            name: user.name || '',
          }
        }
      });

      if (error) {
        console.error('Error de registro:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true, userId: data.user.id };
      }

      return { success: false, error: 'No se pudo completar el registro' };
    } catch (err: any) {
      console.error('Error inesperado en registro:', err.message);
      return { success: false, error: 'Error inesperado durante el registro' };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Limpiar token del localStorage
      localStorage.removeItem('authToken');
      
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