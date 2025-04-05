import { User } from '../../domain/entities/User';

export class AuthApiAdapter {
  async login(email: string, password: string): Promise<{ success: boolean }> {
    // Simulamos validación de credenciales
    console.log(`Intentando login con email: ${email}`);
    const isValidCredentials = email.length > 0 && password.length > 5;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: isValidCredentials });
      }, 800);
    });
  }

  async register(user: User): Promise<{ success: boolean }> {
    // Simulamos registro de usuario
    console.log(`Registrando usuario: ${user.email}`);
    const isValidUser = !!user.email && (user.password?.length ?? 0) > 5;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: isValidUser });
      }, 800);
    });
  }
} 