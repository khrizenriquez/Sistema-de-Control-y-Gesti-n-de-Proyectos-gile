import { User } from '../entities/User';

export class AuthService {
  login(email: string, password: string): boolean {
    // Validar que email y password no estén vacíos
    if (!email || !password) {
      return false;
    }
    
    // Validar formato de email
    if (!this.isValidEmail(email)) {
      return false;
    }
    
    // Validar longitud mínima de password
    if (password.length < 6) {
      return false;
    }
    
    return true;
  }

  register(user: User): boolean {
    // Validar datos de usuario requeridos
    if (!user.email || !user.password) {
      return false;
    }
    
    // Validar formato de email
    if (!this.isValidEmail(user.email)) {
      return false;
    }
    
    // Validar longitud mínima de password
    if (user.password.length < 6) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Valida que un string tenga formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Verifica si hay un token de autenticación guardado
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }
} 