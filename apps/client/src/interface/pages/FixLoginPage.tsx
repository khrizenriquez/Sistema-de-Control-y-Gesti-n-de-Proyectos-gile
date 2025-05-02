import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { supabase } from '../../infrastructure/services/supabase';
// Importar herramientas de diagnóstico
import { runDiagnostics } from '../../fixes/supabaseDebugger';
import { forceNavigation } from '../../fixes/fixAuthentication';

export const FixLoginPage: FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'none' | 'success' | 'error'; message: string }>({ 
    type: 'none', 
    message: '' 
  });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const verifySupabaseConnection = async () => {
    try {
      console.log('Verificando conexión con Supabase...');
      const { data, error } = await supabase.auth.getSession();
      
      // Si el usuario ya está autenticado, redirigir directamente al dashboard
      if (data.session) {
        console.log('Usuario ya tiene sesión activa, redirigiendo inmediatamente...');
        forceNavigation('/dashboard');
        return true;
      }
      
      if (error) {
        console.error('Error al verificar la sesión de Supabase:', error.message);
        setStatus({
          type: 'error',
          message: `Error de conexión: ${error.message}`
        });
        return false;
      }
      
      console.log('Conexión con Supabase verificada:', data.session ? 'Sesión activa' : 'Sin sesión activa');
      return true;
    } catch (err: any) {
      console.error('Error al verificar la conexión:', err.message);
      setStatus({
        type: 'error',
        message: `Error de conexión: ${err.message}`
      });
      return false;
    }
  };

  // Verificar la conexión al cargar el componente
  useEffect(() => {
    verifySupabaseConnection();
    
    // Verificar si hay un mensaje "¡Login exitoso!" hard-codeado en el DOM
    document.querySelectorAll("p").forEach(el => {
      if (el.textContent?.includes("Login exitoso") || el.textContent?.includes("¡Login exitoso!")) {
        console.warn("Encontrado mensaje de login exitoso incorrecto:", el);
        // Al encontrar el elemento con este texto, lo reemplazamos con un texto vacío
        // en lugar de eliminarlo completamente para evitar efectos secundarios
        el.innerHTML = '';
        el.setAttribute('style', 'display: none;');
      }
    });
    
    // También buscar en otros elementos, no solo párrafos
    document.querySelectorAll("div, span").forEach(el => {
      if (el.textContent?.includes("Login exitoso") || el.textContent?.includes("¡Login exitoso!")) {
        console.warn("Encontrado mensaje de login exitoso incorrecto en otro elemento:", el);
        el.innerHTML = '';
        el.setAttribute('style', 'display: none;');
      }
    });
    
    // Ejecutar el diagnóstico de Supabase
    runDiagnostics();
  }, []);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'none', message: '' });
    
    try {
      console.log('Intentando login con Supabase para:', email);
      
      // Eliminar cualquier mensaje "¡Login exitoso!" antes de intentar el login
      document.querySelectorAll("p, div, span").forEach(el => {
        if (el.textContent?.includes("Login exitoso") || el.textContent?.includes("¡Login exitoso!")) {
          console.warn("Eliminando mensaje de login exitoso antes de intentar login:", el);
          el.innerHTML = '';
          el.setAttribute('style', 'display: none;');
        }
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Respuesta de Supabase:', { 
        success: !!data.user, 
        error: error ? error.message : null 
      });

      if (error) {
        setStatus({
          type: 'error',
          message: `Error: ${error.message}`
        });
      } else if (data.user) {
        setStatus({
          type: 'success',
          message: `Autenticación exitosa. Redirigiendo...`
        });
        
        // Usar forceNavigation directamente además del useLocation
        setTimeout(() => {
          try {
            // Método 1: Usar wouter
            setLocation('/dashboard');
            
            // Método 2: Usar navegación directa como respaldo (después de un breve retraso)
            setTimeout(() => {
              forceNavigation('/dashboard');
            }, 300);
          } catch (err) {
            console.error('Error durante la redirección:', err);
            // Si falla, usar el método más directo
            window.location.href = '/dashboard';
          }
        }, 800);
      } else {
        setStatus({
          type: 'error',
          message: 'No se recibió información del usuario'
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
      
      // Volver a verificar si hay mensajes incorrectos después del login
      setTimeout(() => {
        document.querySelectorAll("p, div, span").forEach(el => {
          if (el.textContent?.includes("Login exitoso") || el.textContent?.includes("¡Login exitoso!")) {
            if (!status.type || status.type !== 'success') {
              console.warn("Eliminando mensaje de login exitoso incorrecto después del login:", el);
              el.innerHTML = '';
              el.setAttribute('style', 'display: none;');
            }
          }
        });
      }, 100);
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
          
          <div className="mt-6 text-xs text-gray-500">
            <p>Versión mejorada del login para evitar mensajes incorrectos</p>
            <p>Estado de la conexión: {status.type === 'error' ? '❌ Error' : '✓ Correcto'}</p>
            <button 
              onClick={() => runDiagnostics()} 
              className="mt-2 text-blue-500 underline"
            >
              Ejecutar diagnóstico
            </button>
            <button 
              onClick={() => forceNavigation('/dashboard')} 
              className="ml-3 mt-2 text-blue-500 underline"
            >
              Forzar redirección
            </button>
          </div>
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