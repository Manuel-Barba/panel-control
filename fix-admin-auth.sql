-- Script para corregir problemas de autenticación de administradores
-- Ejecuta este script para asegurar que todo esté configurado correctamente

-- 1. Habilitar la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verificar que la tabla admin_users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        RAISE EXCEPTION 'La tabla admin_users no existe. Ejecuta primero create-admin-users-table.sql';
    END IF;
END $$;

-- 3. Recrear la función verify_admin_credentials con mejor manejo de errores
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Verificar que los parámetros no sean nulos
  IF p_email IS NULL OR p_password IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.first_name,
    au.last_name,
    au.is_active
  FROM admin_users au
  WHERE au.email = p_email
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;
    
  -- Si no se encontró ningún usuario, no retornar nada (tabla vacía)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear la función update_admin_last_login
CREATE OR REPLACE FUNCTION update_admin_last_login(p_admin_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET last_login = NOW(), updated_at = NOW()
  WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar que el usuario administrador existe y tiene el hash correcto
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM admin_users 
    WHERE email = 'meduardoba12@gmail.com';
    
    IF user_count = 0 THEN
        RAISE NOTICE 'Usuario administrador no encontrado. Insertando...';
        INSERT INTO admin_users (email, password_hash, first_name, last_name, is_active)
        VALUES (
            'meduardoba12@gmail.com',
            '$2b$12$q/yQR3zaHo7G1k5F.TiWVucE9ivVDwxEGR4oCvG8cu9kZxOEQ/5Ce',
            'Eduardo',
            'Barba',
            true
        );
    ELSE
        RAISE NOTICE 'Usuario administrador encontrado.';
    END IF;
END $$;

-- 6. Probar la función de verificación
DO $$
DECLARE
    test_result RECORD;
BEGIN
    SELECT * INTO test_result FROM verify_admin_credentials('meduardoba12@gmail.com', 'LozanoLozanoGol123*');
    
    IF test_result.id IS NOT NULL THEN
        RAISE NOTICE 'Prueba de autenticación exitosa para meduardoba12@gmail.com';
    ELSE
        RAISE NOTICE 'Prueba de autenticación fallida. Verifica la contraseña.';
    END IF;
END $$;

-- 7. Mostrar información del usuario administrador
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_active,
    created_at,
    last_login
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';
