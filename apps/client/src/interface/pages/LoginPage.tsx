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
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md bg-white p-8 shadow-md rounded">
        <h1 class="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        <form onSubmit={handleLogin}>
          <div class="mb-4">
            <label class="block mb-2 font-medium">Email</label>
            <input
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="correo@empresa.com"
              required
            />
          </div>
          <div class="mb-4">
            <label class="block mb-2 font-medium">Contraseña</label>
            <input
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="********"
              required
            />
          </div>
          {error && <p class="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p class="text-green-500 text-sm mb-4">¡Login exitoso!</p>}
          <button
            type="submit"
            disabled={loading}
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
          <p class="mt-4 text-center text-sm">
            ¿No tienes cuenta? <Link href="/register" class="text-blue-600 hover:underline">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}; 