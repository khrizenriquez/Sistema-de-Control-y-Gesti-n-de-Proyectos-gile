import { FunctionComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { User } from '../../domain/entities/User';
import { Link, useLocation } from 'wouter-preact';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: FunctionComponent = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const redirectTimerRef = useRef<number | null>(null);
  
  const { register, loading, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }

    // Limpiar temporizador al desmontar
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [user, setLocation]);

  // Evaluar fuerza de la contraseña
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Longitud mínima
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    
    // Complejidad
    if (/[A-Z]/.test(password)) strength += 1; // Mayúsculas
    if (/[0-9]/.test(password)) strength += 1; // Números
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Caracteres especiales

    setPasswordStrength(strength);
  }, [password]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Por favor ingresa un email válido';
    }
    
    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrengthLabel = () => {
    if (password.length === 0) return '';
    if (passwordStrength <= 1) return 'Débil';
    if (passwordStrength <= 3) return 'Moderada';
    return 'Fuerte';
  };

  const getPasswordStrengthClass = () => {
    if (password.length === 0) return '';
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    try {
      const userData: User = {
        id: '', // Este campo se generará en el backend
        email,
        password,
        name
      };
      
      const result = await register(userData);
      
      if (result.success) {
        setSuccess(true);
        // Restablecer formulario
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Redirigir después de un breve retraso para que el usuario vea el mensaje de éxito
        redirectTimerRef.current = window.setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        // Manejar errores comunes de Supabase
        let errorMessage = result.error || 'Error al registrarse';
        
        if (errorMessage.includes('email already')) {
          errorMessage = 'Esta dirección de correo ya está registrada';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        }
        
        setError(errorMessage);
      }
    } catch (err: any) {
      setError(err.message);
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
      
      {/* Contenedor izquierdo (imagen) - visible solo en desktop */}
      <div className="hidden md:block md:w-1/2 bg-indigo-600 relative">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <img 
            src="/dashboard-image.svg" 
            alt="Dashboard ilustración" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
      
      {/* Contenedor derecho (formulario) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 z-10 bg-white bg-opacity-95 md:bg-opacity-100">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-600 mb-8">Regístrate para empezar a usar la plataforma.</p>
          
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                id="name"
                type="text"
                className={`w-full px-4 py-2 border rounded-md ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Nombre y apellido"
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className={`w-full px-4 py-2 border rounded-md ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="correo@empresa.com"
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2 border rounded-md ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  value={password}
                  onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
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
              
              {/* Indicador de fuerza de contraseña */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-grow flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level}
                          className={`h-1 flex-grow rounded-full ${
                            passwordStrength >= level ? getPasswordStrengthClass() : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs ml-2 text-gray-500">{getPasswordStrengthLabel()}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Recomendamos usar letras mayúsculas, minúsculas, números y símbolos
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-2 border rounded-md ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                value={confirmPassword}
                onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                placeholder="Repetir contraseña"
                required
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
            
            {error && (
              <div className="p-3 mb-4 rounded text-sm bg-red-100 text-red-800 border border-red-300">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 mb-4 rounded text-sm bg-green-100 text-green-800 border border-green-300">
                <p className="font-medium">¡Registro exitoso!</p>
                <p>Redirigiendo al inicio de sesión en unos segundos...</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 font-medium"
            >
              {loading ? 'Procesando...' : 'Crear Cuenta'}
            </button>
            
            <p className="mt-8 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta? <Link href="/login" className="text-blue-500 hover:underline font-medium">Inicia sesión aquí</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}; 