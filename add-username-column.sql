-- Script para agregar columna username y crear usuario aleatorio
-- Ejecuta este script para configurar el sistema de autenticación por usuario

-- 1. Habilitar la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Agregar columna username a la tabla admin_users
DO $$
BEGIN
    -- Verificar si la columna username ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' 
        AND column_name = 'username'
    ) THEN
        -- Agregar la columna username
        ALTER TABLE admin_users ADD COLUMN username TEXT UNIQUE;
        
        -- Crear índice para búsquedas rápidas por username
        CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
        
        RAISE NOTICE 'Columna username agregada exitosamente a admin_users';
    ELSE
        RAISE NOTICE 'La columna username ya existe en admin_users';
    END IF;
END $$;

-- 3. Generar un username aleatorio para el usuario existente
DO $$
DECLARE
    random_username TEXT;
    username_exists BOOLEAN;
    counter INTEGER := 0;
BEGIN
    -- Generar username aleatorio hasta encontrar uno único
    LOOP
        -- Generar username aleatorio (8 caracteres)
        random_username := 'admin' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        
        -- Verificar si el username ya existe
        SELECT EXISTS(SELECT 1 FROM admin_users WHERE username = random_username) INTO username_exists;
        
        -- Si no existe, salir del loop
        IF NOT username_exists THEN
            EXIT;
        END IF;
        
        -- Incrementar contador para evitar loop infinito
        counter := counter + 1;
        IF counter > 100 THEN
            random_username := 'admin' || EXTRACT(EPOCH FROM NOW())::TEXT;
            EXIT;
        END IF;
    END LOOP;
    
    -- Actualizar el usuario existente con el username aleatorio y nueva contraseña
    UPDATE admin_users 
    SET 
        username = random_username,
        password_hash = '$2b$12$1OF7IupssshKWoXxcj8si..a.IdPQ1MrtRw8Unt8MTGIcQrjgqCPC', -- Hash de "LozanoLozanoGol123"
        updated_at = NOW()
    WHERE email = 'meduardoba12@gmail.com';
    
    RAISE NOTICE 'Usuario actualizado con username: %', random_username;
END $$;

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

-- 5. Probar la función de verificación
DO $$
DECLARE
    test_result RECORD;
    test_username TEXT;
BEGIN
    -- Obtener el username del usuario
    SELECT username INTO test_username FROM admin_users WHERE email = 'meduardoba12@gmail.com';
    
    -- Probar la autenticación
    SELECT * INTO test_result FROM verify_admin_credentials(test_username, 'LozanoLozanoGol123');
    
    IF test_result.id IS NOT NULL THEN
        RAISE NOTICE 'Prueba de autenticación exitosa para usuario: %', test_username;
    ELSE
        RAISE NOTICE 'Prueba de autenticación fallida para usuario: %', test_username;
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
    updated_at,
    last_login
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';

-- 7. Mostrar instrucciones de uso
DO $$
DECLARE
    user_username TEXT;
BEGIN
    SELECT username INTO user_username FROM admin_users WHERE email = 'meduardoba12@gmail.com';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONFIGURACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuario: %', user_username;
    RAISE NOTICE 'Contraseña: LozanoLozanoGol123';
    RAISE NOTICE 'Email: meduardoba12@gmail.com';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usa estas credenciales para iniciar sesión';
    RAISE NOTICE '========================================';
END $$;
