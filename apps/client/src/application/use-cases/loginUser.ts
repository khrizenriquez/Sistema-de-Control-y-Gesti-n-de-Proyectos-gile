import { AuthService } from '../../domain/services/AuthService';
import { AuthApiAdapter } from '../../infrastructure/adapters/AuthApiAdapter';

interface LoginUserParams {
  email: string;
  password: string;
}

export async function loginUser(params: LoginUserParams) {
  console.log('⭐️ Iniciando proceso de login para:', params.email);
  
  // Primera validación: formato básico de datos
  const authService = new AuthService();
  const isValid = authService.login(params.email, params.password);
  
  if (!isValid) {
    console.error('❌ Validación básica fallida: formato de email o longitud de contraseña incorrectos');
    return { success: false, error: 'Datos de login inválidos' };
  }
  
  // Segunda validación: autenticación real con Supabase
  console.log('✅ Validación básica exitosa, procediendo con autenticación Supabase');
  const authApi = new AuthApiAdapter();
  
  try {
    const result = await authApi.login(params.email, params.password);
    
    // Log del resultado para diagnóstico
    console.log('🔐 Resultado de autenticación:', {
      success: result.success,
      error: result.error || 'Sin errores',
      user: result.user ? `Usuario ${result.user.email}` : 'Sin usuario'
    });
    
    // Verificar explícitamente que el resultado sea exitoso
    if (!result.success || !result.user) {
      console.error('❌ Autenticación fallida con Supabase');
      return { success: false, error: result.error || 'Credenciales incorrectas' };
    }
    
    console.log('🎉 Autenticación exitosa con Supabase');
    return result;
  } catch (error: any) {
    console.error('❌ Error en el proceso de login:', error);
    return { success: false, error: error.message || 'Error inesperado durante el login' };
  }
} 