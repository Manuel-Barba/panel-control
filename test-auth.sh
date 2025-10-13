#!/bin/bash

# Script para probar la autenticación del panel de control
# Ejecuta este script después de aplicar las correcciones

echo "🔧 Probando autenticación del panel de control..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para hacer petición HTTP
test_login() {
    local username="$1"
    local password="$2"
    local expected_status="$3"
    local description="$4"
    
    echo "📝 Probando: $description"
    echo "   Usuario: $username"
    echo "   Contraseña: ${password:0:3}***"
    
    response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "   ✅ Status: $http_code (esperado: $expected_status)"
        echo "   📄 Respuesta: $body"
    else
        echo "   ❌ Status: $http_code (esperado: $expected_status)"
        echo "   📄 Respuesta: $body"
    fi
    echo ""
}

# Verificar que el servidor esté corriendo
echo "🌐 Verificando que el servidor esté corriendo..."
if curl -s http://localhost:3000/api/auth/login > /dev/null; then
    echo "✅ Servidor está corriendo en localhost:3000"
else
    echo "❌ Servidor no está corriendo. Inicia el servidor con:"
    echo "   cd panel-control && npm run dev"
    exit 1
fi
echo ""

# Pruebas
echo "🧪 Ejecutando pruebas de autenticación..."
echo ""

# Prueba 1: Credenciales correctas (usar el username generado por el script)
test_login "admin0001" "LozanoLozanoGol123" "200" "Credenciales correctas"

# Prueba 2: Usuario incorrecto
test_login "wronguser" "LozanoLozanoGol123" "401" "Usuario incorrecto"

# Prueba 3: Contraseña incorrecta
test_login "admin0001" "wrongpassword" "401" "Contraseña incorrecta"

# Prueba 4: Usuario vacío
test_login "" "LozanoLozanoGol123" "400" "Usuario vacío"

# Prueba 5: Contraseña vacía
test_login "admin0001" "" "400" "Contraseña vacía"

echo "🏁 Pruebas completadas!"
echo ""
echo "📋 Resumen:"
echo "   - Si todas las pruebas pasan, el sistema de autenticación está funcionando correctamente"
echo "   - Si hay errores 500, ejecuta el script fix-admin-auth.sql en tu base de datos"
echo "   - Si hay errores 404, verifica que las rutas de la API estén configuradas correctamente"
