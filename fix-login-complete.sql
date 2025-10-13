-- Script completo para solucionar problemas de login
-- Ejecutar paso a paso

-- PASO 1: Verificar estructura de la tabla admin_users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- PASO 2: Agregar columna last_login si no existe
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- PASO 3: Verificar que existe la función verify_admin_credentials
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'verify_admin_credentials';

-- PASO 4: Crear función update_admin_last_login
CREATE OR REPLACE FUNCTION update_admin_last_login(p_admin_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET last_login = NOW()
  WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Actualizar contraseña del usuario
UPDATE admin_users 
SET 
    password_hash = crypt('LozanoLozanoGol123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'meduardoba12@gmail.com';

-- PASO 6: Verificar datos del usuario
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at,
    last_login
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';

-- PASO 7: Probar función de verificación
SELECT * FROM verify_admin_credentials('eduardo', 'LozanoLozanoGol123');

-- PASO 8: Probar función de actualización de login
SELECT update_admin_last_login((SELECT id FROM admin_users WHERE email = 'meduardoba12@gmail.com'));

-- PASO 9: Verificar que se actualizó el last_login
SELECT 
    username,
    last_login
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';
