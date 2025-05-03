import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { supabase } from '../infrastructure/services/supabase';

export const CustomLogin: FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'none' | 'success' | 'error'; message: string }>({ 
    type: 'none', 
    message: '' 
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'none', message: '' });
    
    try {
      // Login directo con Supabase sin usar el adaptador
      console.log('Intentando login directamente con Supabase');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Respuesta directa de Supabase:', {
        success: !!data.user,
        error: error?.message || null,
        user: data.user ? 'User data received' : null
      });
      
      if (error) {
        setStatus({
          type: 'error',
          message: `Error de autenticación: ${error.message}`
        });
      } else if (data.user) {
        setStatus({
          type: 'success',
          message: `Autenticación exitosa para ${data.user.email}`
        });
      } else {
        setStatus({
          type: 'error',
          message: 'No se recibieron datos de usuario. Autenticación fallida.'
        });
      }
    } catch (err: any) {
      console.error('Error capturado:', err);
      setStatus({
        type: 'error',
        message: `Error inesperado: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Formulario de Login Directo</h2>
      <p className="text-sm text-gray-600 mb-4">Este formulario utiliza Supabase directamente para pruebas de depuración.</p>
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="nombre@empresa.com"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="********"
            required
          />
        </div>
        
        {status.type !== 'none' && (
          <div className={`p-3 mb-4 rounded ${
            status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status.message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {loading ? 'Procesando...' : 'Iniciar sesión directo'}
        </button>
      </form>
    </div>
  );
}; 