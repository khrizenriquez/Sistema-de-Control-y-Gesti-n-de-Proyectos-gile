import { ApiAdapter } from '../../infrastructure/adapters/ApiAdapter';
import { User } from '../../domain/entities/User';

// Interfaz para el perfil de usuario
interface UserProfile {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

// Interfaz para actualizar el perfil
interface ProfileUpdate {
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
}

export class UserService {
  private api: ApiAdapter;
  
  constructor() {
    this.api = new ApiAdapter();
  }
  
  /**
   * Obtiene el perfil del usuario actual
   */
  async getMyProfile(): Promise<UserProfile> {
    return this.api.get<UserProfile>('/users/me');
  }
  
  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(profileData: ProfileUpdate): Promise<UserProfile> {
    return this.api.put<UserProfile>('/users/me', profileData);
  }
  
  /**
   * Convierte un UserProfile a un User de dominio
   */
  mapProfileToUser(profile: UserProfile): User {
    return {
      id: profile.auth_id,
      email: profile.email,
      name: `${profile.first_name} ${profile.last_name}`.trim()
    };
  }
} 