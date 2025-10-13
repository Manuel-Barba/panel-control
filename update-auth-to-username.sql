-- Script para cambiar autenticación por usuario y actualizar contraseña
-- Ejecuta este script para implementar los cambios solicitados

-- 1. Habilitar la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Agregar campo username a la tabla admin_users si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'username') THEN
        ALTER TABLE admin_users ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'Campo username agregado a admin_users';
    END IF;
END $$;

-- 3. Actualizar el usuario existente con username y nueva contraseña
-- Hash generado con bcrypt para "LozanoLozanoGol123" (salt rounds: 12)
UPDATE admin_users 
SET 
    username = 'eduardo',
    password_hash = '$2b$12$1OF7IupssshKWoXxcj8si..a.IdPQ1MrtRw8Unt8MTGIcQrjgqCPC',
    updated_at = NOW()
WHERE email = 'meduardoba12@gmail.com';

-- 4. Recrear la función verify_admin_credentials para usar username
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Verificar que los parámetros no sean nulos
  IF p_username IS NULL OR p_password IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.username,
    au.email,
    au.first_name,
    au.last_name,
    au.is_active
  FROM admin_users au
  WHERE au.username = p_username
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;
    
  -- Si no se encontró ningún usuario, no retornar nada (tabla vacía)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Probar la función de verificación con el nuevo username
DO $$
DECLARE
    test_result RECORD;
BEGIN
    SELECT * INTO test_result FROM verify_admin_credentials('eduardo', 'LozanoLozanoGol123');
    
    IF test_result.id IS NOT NULL THEN
        RAISE NOTICE 'Prueba de autenticación exitosa para usuario: eduardo';
    ELSE
        RAISE NOTICE 'Prueba de autenticación fallida. Verifica la contraseña.';
    END IF;
END $$;

-- 6. Mostrar información del usuario administrador actualizado
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    is_active,
    created_at,
    last_login
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';
