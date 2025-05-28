import { createContext, ComponentChildren } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { User } from '../domain/entities/User';
import { supabase, getCurrentUser, setupSessionListener } from '../infrastructure/services/supabase';
import { AuthApiAdapter } from '../infrastructure/adapters/AuthApiAdapter';
import { createClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (user: User) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  logoutFromAllDevices: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
  checkSession: () => Promise<boolean>;
  updateUserRole: (role: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: any }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authApi = new AuthApiAdapter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authApi.validateToken();
          if (response.valid) {
            const userInfo = await authApi.getCurrentUser();
            setUser(userInfo);
            setLoading(false);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Configurar listener para cambios en la autenticación
    const cleanupListener = setupSessionListener(
      // Callback para cuando el usuario se autentica
      (session) => {
        getCurrentUser().then(currentUser => {
          if (currentUser) {
            // Log para diagnóstico
            console.log('🔄 Cambio de sesión detectado:', {
              id: currentUser.id,
              email: currentUser.email,
              metadata: currentUser.user_metadata
            });
            
            const userData = {
              id: currentUser.id,
              email: currentUser.email || '',
              name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || '',
              role: currentUser.user_metadata?.role || 'member'
            };
            
            console.log('🔄 Usuario actualizado:', userData);
            setUser(userData);
          }
          setLoading(false);
        });
      },
      // Callback para cuando el usuario cierra sesión
      () => {
        setUser(null);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      cleanupListener();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authApi.login(email, password);
      
      // Si el login es exitoso, actualizamos el usuario en el contexto
      if (result.success && result.user) {
        setUser(result.user);
        
        // Sincronizar el rol del usuario con el backend
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/sync-roles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.role) {
              // Actualizar el rol del usuario en el contexto
              setUser(prevUser => {
                if (!prevUser) return null;
                return {
                  ...prevUser,
                  role: data.role
                };
              });
              console.log('Rol sincronizado correctamente:', data.role);
            }
          }
        } catch (syncError) {
          console.error('Error al sincronizar rol:', syncError);
        }
      }
      
      return result;
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: User) => {
    try {
      setLoading(true);
      const result = await authApi.register(userData);
      
      // En algunos casos, el registro también inicia sesión automáticamente
      if (result.success && result.user) {
        setUser(result.user);
      }
      
      return { success: result.success, error: result.error };
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const result = await authApi.logout();
      if (result.success) {
        setUser(null);
      }
      return result;
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  const logoutFromAllDevices = async () => {
    try {
      setLoading(true);
      const result = await authApi.logoutFromAllDevices();
      if (result.success) {
        setUser(null);
      }
      return result;
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  const refreshSession = async () => {
    try {
      setLoading(true);
      return await authApi.refreshAuthSession();
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  
  const checkSession = async () => {
    try {
      return await authApi.hasValidSession();
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  };

  const updateUserRole = async (role: string) => {
    try {
      setLoading(true);
      const result = await authApi.updateUserRole(role);
      
      // Si la actualización es exitosa, actualizar el usuario en el estado
      if (result.success && user) {
        setUser({
          ...user,
          role
        });
      }
      
      return result;
    } catch (error: any) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        logoutFromAllDevices,
        refreshSession,
        checkSession,
        updateUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 