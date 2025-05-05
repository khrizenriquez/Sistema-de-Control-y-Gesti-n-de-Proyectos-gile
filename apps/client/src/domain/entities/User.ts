// src/domain/entities/User.ts
export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  role?: string; // Posibles valores: 'admin', 'developer', 'product_owner', 'member'
} 