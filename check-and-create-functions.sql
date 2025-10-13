-- Script para verificar y crear funciones necesarias para el login

-- 1. Verificar si existe la función verify_admin_credentials
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'verify_admin_credentials';

-- 2. Verificar si existe la función update_admin_last_login
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'update_admin_last_login';

-- 3. Crear función update_admin_last_login si no existe
CREATE OR REPLACE FUNCTION update_admin_last_login(p_admin_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET last_login = NOW()
  WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar que ambas funciones existen
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('verify_admin_credentials', 'update_admin_last_login')
ORDER BY routine_name;
