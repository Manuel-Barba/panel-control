-- Script para actualizar la contraseña del usuario admin
-- Contraseña: LozanoLozanoGol123

-- Actualizar contraseña del usuario
UPDATE admin_users 
SET 
    password_hash = crypt('LozanoLozanoGol123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'meduardoba12@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';

-- Probar la función de verificación
SELECT * FROM verify_admin_credentials('eduardo', 'LozanoLozanoGol123');
