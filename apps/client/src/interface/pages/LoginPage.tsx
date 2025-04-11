import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { loginUser } from '../../application/use-cases/loginUser';
import { Link } from 'wouter-preact';

export const LoginPage: FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const result = await loginUser({ email, password });
      if (result.success) {
        setSuccess(true);
      } else {
        setError('Login fallido');
      }
    } catch (err: any) {
      setError(err.message);
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
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">¡Login exitoso!</p>}
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