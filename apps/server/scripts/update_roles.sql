-- Script para asignar roles correctos a los usuarios predefinidos
-- Este script es idempotente (se puede ejecutar múltiples veces sin efectos negativos)

-- Asignar roles a los usuarios predefinidos
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@ingsistemas.gt';
UPDATE user_profiles SET role = 'developer' WHERE email = 'dev@ingsistemas.gt';
UPDATE user_profiles SET role = 'product_owner' WHERE email = 'pm@ingsistemas.gt';
UPDATE user_profiles SET role = 'member' WHERE email = 'member@ingsistemas.gt';

-- Log para confirmar la ejecución (este mensaje se mostrará en el log del contenedor)
SELECT 'Roles de usuario actualizados correctamente' as message; 