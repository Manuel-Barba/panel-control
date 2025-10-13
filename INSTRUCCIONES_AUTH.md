# Instrucciones para Configurar Autenticación por Usuario

## 📋 Resumen de Cambios Realizados

Se ha cambiado el sistema de autenticación del panel de control para usar **username** en lugar de **email**.

## 🔧 Pasos para Configurar

### 1. Ejecutar el Script de Base de Datos

```bash
# Conecta a tu base de datos PostgreSQL y ejecuta:
psql -d tu_base_de_datos -f add-username-column.sql
```

Este script:
- ✅ Agrega la columna `username` a la tabla `admin_users`
- ✅ Genera un username aleatorio para el usuario `meduardoba12@gmail.com`
- ✅ Actualiza la contraseña a `LozanoLozanoGol123`
- ✅ Recrea las funciones de autenticación
- ✅ Prueba que todo funcione correctamente

### 2. Verificar las Variables de Entorno

Asegúrate de tener configurado `JWT_SECRET` en tu archivo `.env`:

```env
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
```

### 3. Reiniciar el Servidor

```bash
cd panel-control
npm run dev
```

## 🔑 Credenciales de Acceso

Después de ejecutar el script SQL, tendrás:

- **Usuario**: `adminXXXX` (donde XXXX es un número aleatorio generado)
- **Contraseña**: `LozanoLozanoGol123`
- **Email**: `meduardoba12@gmail.com`

El script te mostrará el username exacto al finalizar.

## 🧪 Probar la Autenticación

```bash
# Ejecuta el script de prueba
./test-auth.sh
```

**Nota**: Actualiza el username en el script de prueba con el que se generó.

## 📁 Archivos Modificados

### Frontend
- `components/LoginForm.tsx` - Cambiado de email a username
- `hooks/useAuth.tsx` - Actualizado para usar username
- `app/login/page.tsx` - Actualizado para manejar username

### Backend
- `app/api/auth/login/route.ts` - Cambiado de email a username
- `app/api/auth/verify/route.ts` - Incluye username en respuesta

### Base de Datos
- `add-username-column.sql` - Script para configurar todo
- `test-auth.sh` - Script de pruebas actualizado

## 🎯 Funcionalidades

### ✅ Lo que funciona ahora:
- Autenticación por username (no email)
- Contraseña actualizada a `LozanoLozanoGol123`
- Mejor manejo de errores
- Username aleatorio generado automáticamente
- Verificación de token incluye username

### 🔄 Cambios en la Interfaz:
- El campo ahora dice "Usuario" en lugar de "Email"
- Placeholder cambió a "tu_usuario"
- Validación actualizada para username

## 🚨 Solución de Problemas

### Si obtienes error 500:
1. Verifica que ejecutaste el script SQL
2. Revisa que la extensión `pgcrypto` esté habilitada
3. Confirma que las funciones se crearon correctamente

### Si obtienes error 401:
1. Verifica que el username sea correcto
2. Confirma que la contraseña sea `LozanoLozanoGol123`
3. Revisa que el usuario esté activo en la base de datos

### Si obtienes error 404:
1. Verifica que el servidor esté corriendo
2. Confirma que las rutas de la API estén correctas

## 📞 Soporte

Si tienes problemas:
1. Ejecuta el script SQL y revisa los mensajes
2. Revisa los logs del servidor
3. Usa el script de prueba para diagnosticar

## 🎉 ¡Listo!

Una vez completados estos pasos, podrás iniciar sesión usando el username generado y la nueva contraseña.
