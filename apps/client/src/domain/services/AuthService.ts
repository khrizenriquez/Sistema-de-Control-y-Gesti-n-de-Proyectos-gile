import { User } from '../entities/User';

export class AuthService {
  login(email: string, password: string): boolean {
    // Validación simple: en una implementación real aquí irían reglas más complejas.
    return email.length > 0 && password.length > 0;
  }

  register(user: User): boolean {
    // Validación simple: podrías agregar validaciones de formato, fuerza de contraseña, etc.
    return !!user.email && !!user.password;
  }
} 