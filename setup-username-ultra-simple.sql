-- Script SQL ultra-simplificado - Ejecuta paso a paso
-- Si tienes problemas, ejecuta solo los pasos que funcionen

-- PASO 1: Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASO 2: Agregar columna username
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT;

-- PASO 3: Actualizar usuario con username y nueva contraseña
UPDATE admin_users 
SET 
    username = 'eduardo',
    password_hash = '$2b$12$1OF7IupssshKWoXxcj8si..a.IdPQ1MrtRw8Unt8MTGIcQrjgqCPC',
    updated_at = NOW()
WHERE email = 'meduardoba12@gmail.com';

-- PASO 4: Hacer username único (después de agregar datos)
ALTER TABLE admin_users ADD CONSTRAINT unique_username UNIQUE (username);

-- PASO 5: Eliminar función existente y recrear función de verificación
DROP FUNCTION IF EXISTS verify_admin_credentials(TEXT, TEXT);

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Verificar que todo funciona
SELECT * FROM verify_admin_credentials('eduardo', 'LozanoLozanoGol123');

-- PASO 7: Mostrar información del usuario
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    is_active
FROM admin_users 
WHERE email = 'meduardoba12@gmail.com';
