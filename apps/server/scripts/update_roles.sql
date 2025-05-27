-- Script para crear usuarios predefinidos y asignar roles correctos

-- Insertar usuarios solo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@ingsistemas.gt') THEN
        INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, role, created_at, updated_at, is_active)
        VALUES (gen_random_uuid(), 'admin-id', 'Admin', 'Usuario', 'admin@ingsistemas.gt', 'admin', NOW(), NOW(), true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'dev@ingsistemas.gt') THEN
        INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, role, created_at, updated_at, is_active)
        VALUES (gen_random_uuid(), 'dev-id', 'Desarrollador', 'Ejemplo', 'dev@ingsistemas.gt', 'developer', NOW(), NOW(), true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'pm@ingsistemas.gt') THEN
        INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, role, created_at, updated_at, is_active)
        VALUES (gen_random_uuid(), 'pm-id', 'Project', 'Manager', 'pm@ingsistemas.gt', 'product_owner', NOW(), NOW(), true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'member@ingsistemas.gt') THEN
        INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, role, created_at, updated_at, is_active)
        VALUES (gen_random_uuid(), 'member-id', 'Miembro', 'Regular', 'member@ingsistemas.gt', 'member', NOW(), NOW(), true);
    END IF;
END
$$;

-- Actualizar roles si ya existen
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@ingsistemas.gt';
UPDATE user_profiles SET role = 'developer' WHERE email = 'dev@ingsistemas.gt';
UPDATE user_profiles SET role = 'product_owner' WHERE email = 'pm@ingsistemas.gt';
UPDATE user_profiles SET role = 'member' WHERE email = 'member@ingsistemas.gt';

-- Confirmación
SELECT 'Roles de usuario actualizados correctamente' as message; 