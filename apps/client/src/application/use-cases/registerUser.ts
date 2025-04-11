import { AuthService } from '../../domain/services/AuthService';
import { AuthApiAdapter } from '../../infrastructure/adapters/AuthApiAdapter';
import { User } from '../../domain/entities/User';

export async function registerUser(user: User) {
  const authService = new AuthService();
  const isValid = authService.register(user);
  if (!isValid) {
    throw new Error('Datos de registro inválidos');
  }
  const authApi = new AuthApiAdapter();
  const result = await authApi.register(user);
  return result;
} 