import { FunctionalComponent } from 'preact';
import { Route, useLocation } from 'wouter-preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { isAuthenticated, getCurrentUser } from '../../infrastructure/services/supabase';

interface ProtectedRouteProps {
  component: FunctionalComponent<any>;
  path: string;
}

export const ProtectedRoute: FunctionalComponent<ProtectedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [retries, setRetries] = useState(0);
  const [, setLocation] = useLocation();
  const redirecting = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      // Evitar verificaciones si ya estamos redirigiendo
      if (redirecting.current) return;
      
      try {
        setLoading(true);
        
        // Verificar autenticación y usuario
        const auth = await isAuthenticated();
        const user = await getCurrentUser();
        
        console.log('Estado de autenticación en ProtectedRoute:', {
          isAuthenticated: auth,
          hasUser: !!user,
          userId: user?.id,
          path: rest.path
        });
        
        if (isMounted) {
          setIsAuth(auth);
          
          if (!auth) {
            console.log('Usuario no autenticado, redirigiendo a login...');
            
            // Prevenir múltiples redirecciones
            redirecting.current = true;
            
            // Intentar redirección a /login
            try {
              setLocation('/login');
            } catch (e) {
              console.error('Error al redirigir con router:', e);
              
              // Fallback a redirección directa
              window.location.href = '/login';
            }
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al verificar autenticación:', err);
        
        if (isMounted) {
          // Si hay un error y aún no hemos intentado muchas veces, reintentamos
          if (retries < 3) {
            setRetries(prev => prev + 1);
            setTimeout(checkAuth, 1000);
          } else {
            setIsAuth(false);
            setLoading(false);
            
            if (!redirecting.current) {
              redirecting.current = true;
              // Redirigir después de múltiples intentos fallidos
              setLocation('/login');
            }
          }
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
      redirecting.current = false;
    };
  }, [setLocation, retries, rest.path]);

  return (
    <Route
      {...rest}
      component={(props) => 
        loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            {retries > 0 && (
              <p className="ml-3 text-sm text-gray-600">
                Verificando autenticación... ({retries}/3)
              </p>
            )}
          </div>
        ) : isAuth ? (
          <Component {...props} />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            {retries > 0 && (
              <p className="ml-3 text-sm text-gray-600">
                Verificando autenticación... ({retries}/3)
              </p>
            )}
          </div>
        )
      }
    />
  );
}; 