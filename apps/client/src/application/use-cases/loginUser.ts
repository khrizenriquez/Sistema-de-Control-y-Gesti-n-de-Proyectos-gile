import { AuthService } from '../../domain/services/AuthService';
import { AuthApiAdapter } from '../../infrastructure/adapters/AuthApiAdapter';

interface LoginUserParams {
  email: string;
  password: string;
}

export async function loginUser(params: LoginUserParams) {
  const authService = new AuthService();
  const isValid = authService.login(params.email, params.password);
  if (!isValid) {
    throw new Error('Datos de login inválidos');
  }
  const authApi = new AuthApiAdapter();
  const result = await authApi.login(params.email, params.password);
  return result;
} 