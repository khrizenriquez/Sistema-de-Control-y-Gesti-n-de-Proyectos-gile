import { FunctionalComponent } from 'preact';
import { Route, useLocation } from 'wouter-preact';
import { useState, useEffect } from 'preact/hooks';
import { isAuthenticated } from '../../infrastructure/services/supabase';
import { LoginPage } from '../pages/LoginPage';

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
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const auth = await isAuthenticated();
      setIsAuth(auth);
      
      if (!auth) {
        setLocation('/login');
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [setLocation]);

  return (
    <Route
      {...rest}
      component={(props) => 
        loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isAuth ? (
          <Component {...props} />
        ) : (
          <LoginPage />
        )
      }
    />
  );
}; 