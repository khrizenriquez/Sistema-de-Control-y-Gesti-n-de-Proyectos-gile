import { FunctionComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../infrastructure/services/supabase';

export const LoginPage: FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'none' | 'success' | 'error'; message: string }>({ 
    type: 'none', 
    message: '' 
  });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);
  
  const { login, user } = useAuth();

  // Verificar sesión una sola vez al montar
  useEffect(() => {
    const checkAuth = async () => {
      // Evitar múltiples redirecciones
      if (hasRedirected.current) return;
      
      try {
        // Verificar si ya hay una sesión activa
        const { data } = await supabase.auth.getSession();
        
        if (data.session || user) {
          console.log('Usuario autenticado, redirigiendo al dashboard');
          hasRedirected.current = true;
          setLocation('/dashboard');
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      }
    };
    
    checkAuth();
    
    // Limpiar flag al desmontar
    return () => {
      hasRedirected.current = false;
    };
  }, [setLocation, user]);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'none', message: '' });
    
    try {
      console.log('Intentando login para:', email);
      
      const result = await login(email, password);
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: 'Autenticación exitosa. Redirigiendo...'
        });
        
        // Redirigir después de un breve retraso
        setTimeout(() => {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            setLocation('/dashboard');
          }
        }, 800);
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Error de autenticación'
        });
      }
    } catch (err: any) {
      console.error('Error inesperado en login:', err);
      setStatus({
        type: 'error',
        message: `Error inesperado: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Imagen de fondo para móvil */}
      <div className="md:hidden fixed inset-0 z-0 bg-indigo-600">
        <div className="absolute inset-0 flex items-center justify-center p-4 opacity-20">
          <img 
            src="/dashboard-image.svg" 
            alt="Dashboard ilustración" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
      
      {/* Contenedor izquierdo (formulario) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 z-10 bg-white bg-opacity-95 md:bg-opacity-100">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Te damos la bienvenida</h1>
          <p className="text-gray-600 mb-8">Empieza ya tu prueba gratis. No se necesita tarjeta de crédito.</p>
          
          <form onSubmit={handleLogin} id="login-form">
            <div className="mb-4">
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="nombre@empresa.com"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="Contraseña"
                required
              />
            </div>
            
            {status.type !== 'none' && (
              <div className={`p-3 mb-4 rounded text-sm ${
                status.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`} id="status-message">
                {status.message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Cargando...' : 'Continuar'}
            </button>
            
            <p className="mt-8 text-center text-sm">
              ¿No tienes cuenta? <Link href="/register" className="text-blue-500 hover:underline">Regístrate aquí</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Contenedor derecho (imagen) - visible solo en desktop */}
      <div className="hidden md:block md:w-1/2 bg-indigo-600 relative">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <img 
            src="/dashboard-image.svg" 
            alt="Dashboard ilustración" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}; 