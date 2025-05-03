import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { User } from '../domain/entities/User';
import { supabase, getCurrentUser, setupSessionListener } from '../infrastructure/services/supabase';
import { AuthApiAdapter } from '../infrastructure/adapters/AuthApiAdapter';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: any }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authApi = new AuthApiAdapter();

  useEffect(() => {
    // Check active session when the app loads
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser ? {
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || ''
        } : null);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configurar listener para cambios en la autenticación
    const cleanupListener = setupSessionListener(
      // Callback para cuando el usuario se autentica
      (session) => {
        getCurrentUser().then(currentUser => {
          if (currentUser) {
            setUser({
              id: currentUser.id,
              email: currentUser.email || '',
              name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || ''
            });
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
        checkSession
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