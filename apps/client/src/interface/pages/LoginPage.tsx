import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { useAuth } from '../../context/AuthContext';
import { CustomLogin } from '../../components/CustomLogin';

export const LoginPage: FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [showDebugLogin, setShowDebugLogin] = useState(false);
  const [, setLocation] = useLocation();
  
  const { login, loading, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      console.log('Usuario ya autenticado, redirigiendo al dashboard');
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoginStatus('Intentando autenticar...');

    try {
      console.log('Intentando login con:', { email });
      const result = await login(email, password);
      
      console.log('Resultado del login:', result);
      
      if (result.success) {
        setLoginStatus('Autenticación exitosa, redirigiendo...');
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1000);
      } else {
        setLoginStatus(null);
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      console.error('Error capturado en LoginPage:', err);
      setLoginStatus(null);
      setError(err.message);
    }
  };

  // Este bloque elimina los mensajes de estado después de 3 segundos
  useEffect(() => {
    if (loginStatus) {
      const timer = setTimeout(() => {
        setLoginStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loginStatus]);

  // Función para verificar si hay elementos externos manipulando el DOM
  useEffect(() => {
    const checkForExternalMessages = () => {
      // Buscar elementos con texto "Login exitoso"
      const elements = document.querySelectorAll('*');
      let exitosoFound = false;
      
      elements.forEach(el => {
        if (el.textContent?.includes('Login exitoso') || el.textContent?.includes('¡Login exitoso!')) {
          console.warn('Encontrado elemento con "Login exitoso":', el);
          exitosoFound = true;
        }
      });
      
      if (exitosoFound) {
        console.warn('Se encontraron elementos con "Login exitoso" en el DOM');
      }
    };
    
    // Comprobar cada segundo
    const interval = setInterval(checkForExternalMessages, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Función para mostrar el formulario de depuración
  const toggleDebugLogin = () => {
    setShowDebugLogin(!showDebugLogin);
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
          
          {showDebugLogin ? (
            <>
              <CustomLogin />
              <button 
                onClick={toggleDebugLogin}
                className="mt-4 text-blue-500 underline text-sm"
              >
                Volver al formulario normal
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleLogin}>
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
                {error && (
                  <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-2 rounded mb-4">
                    {error}
                  </div>
                )}
                {loginStatus && (
                  <div className="bg-blue-100 border border-blue-300 text-blue-600 px-4 py-2 rounded mb-4">
                    {loginStatus}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {loading ? 'Cargando...' : 'Continuar'}
                </button>
                
                <p className="mt-8 text-center text-sm">
                  ¿No tienes cuenta? <Link href="/register" className="text-blue-500 hover:underline">Regístrate aquí</Link>
                </p>
              </form>
              
              <button 
                onClick={toggleDebugLogin}
                className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-md w-full text-sm"
              >
                Modo depuración
              </button>
            </>
          )}
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