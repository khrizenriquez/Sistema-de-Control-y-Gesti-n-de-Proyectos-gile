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
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);
  
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
    
    // Limpiar flag y temporizador al desmontar
    return () => {
      hasRedirected.current = false;
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [setLocation, user]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Por favor ingresa un email válido';
    }
    
    if (!password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setStatus({ type: 'none', message: '' });
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Intentando login para:', email);
      
      const result = await login(email, password);
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: 'Autenticación exitosa. Redirigiendo...'
        });
        
        // Redirigir después de un breve retraso
        if (redirectTimerRef.current) {
          window.clearTimeout(redirectTimerRef.current);
        }
        
        redirectTimerRef.current = window.setTimeout(() => {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            setLocation('/dashboard');
          }
        }, 1000);
      } else {
        // Manejar mensajes de error comunes para mejor UX
        let errorMessage = result.error || 'Error de autenticación';
        
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'Demasiados intentos fallidos. Intenta nuevamente más tarde.';
        }
        
        setStatus({
          type: 'error',
          message: errorMessage
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
          <p className="text-gray-600 mb-8">Inicia sesión para acceder a tu cuenta.</p>
          
          <form onSubmit={handleLogin} id="login-form">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className={`w-full px-4 py-2 border rounded-md ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="nombre@empresa.com"
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2 border rounded-md ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  value={password}
                  onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
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
              className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 font-medium"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
            
            <p className="mt-8 text-center text-sm text-gray-600">
              ¿No tienes cuenta? <Link href="/register" className="text-blue-500 hover:underline font-medium">Regístrate aquí</Link>
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