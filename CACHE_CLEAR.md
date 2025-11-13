# 🗑️ Sistema de Limpieza Remota de Caché

## Descripción

Sistema implementado para que los administradores puedan limpiar el caché de usuarios de forma remota desde el panel de control, sin necesidad de que los usuarios lo hagan manualmente.

## Funcionalidad

Los administradores pueden limpiar el caché de cualquier usuario directamente desde la tabla de usuarios en el panel de control, haciendo clic en el botón de refrescar (🔄) junto a cada usuario.

## Configuración Requerida

### 1. Variables de Entorno

#### En `panel-control/.env.local`:
```env
SUPABASE_JWT_SECRET=tu-secret-compartido
NEXT_PUBLIC_APP_URL=http://localhost:3000  # o tu URL de producción
```

#### En `impulsa-ai-app/.env.local`:
```env
SUPABASE_JWT_SECRET=tu-secret-compartido  # Debe ser el mismo que en panel-control
```

**⚠️ IMPORTANTE:** Ambos proyectos deben usar el mismo `SUPABASE_JWT_SECRET` para que la autenticación funcione.

### 2. Instalación de Dependencias

Asegúrate de que `jsonwebtoken` esté instalado en ambos proyectos:

```bash
# En impulsa-ai-app
npm install jsonwebtoken @types/jsonwebtoken

# En panel-control (ya debería estar instalado)
npm install jsonwebtoken @types/jsonwebtoken
```

## Arquitectura

### Flujo de Limpieza de Caché

1. **Admin hace clic en el botón** en `UsersTable.tsx`
2. **Panel-control** llama a `/api/cache/clear-user` con el token de admin
3. **Endpoint del panel-control** verifica autenticación y llama a la app principal
4. **App principal** (`/api/cache/clear`) verifica el token de admin y limpia el caché
5. **Respuesta** se devuelve al admin con confirmación

### Endpoints

#### Panel Control: `/api/cache/clear-user`
- **Método:** POST
- **Autenticación:** Bearer token (JWT de admin)
- **Body:**
  ```json
  {
    "userId": "uuid-del-usuario",
    "userEmail": "email@ejemplo.com"
  }
  ```

#### App Principal: `/api/cache/clear`
- **Método:** POST
- **Autenticación:** Header `X-Admin-Token` (JWT de admin)
- **Body:**
  ```json
  {
    "userId": "uuid-del-usuario",
    "userEmail": "email@ejemplo.com",
    "clearAll": false
  }
  ```

## Uso

1. Inicia sesión en el panel de control como administrador
2. Ve a la sección "Usuarios Recientes" en el dashboard
3. Encuentra el usuario que tiene problemas de caché
4. Haz clic en el botón azul de refrescar (🔄) junto al usuario
5. Espera la confirmación de éxito

## Logs

Todas las acciones de limpieza de caché se registran en los logs del servidor:

```
[CACHE CLEAR] Admin {adminId} limpió caché para: {
  userId: "...",
  userEmail: "...",
  clearAll: false,
  timestamp: "..."
}
```

## Seguridad

- ✅ Autenticación JWT requerida en ambos endpoints
- ✅ Verificación de tipo de token (debe ser 'admin')
- ✅ Logs de auditoría para todas las acciones
- ✅ Validación de permisos en cada paso

## Troubleshooting

### Error: "Token de administrador requerido"
- Verifica que `SUPABASE_JWT_SECRET` esté configurado en ambos proyectos
- Asegúrate de que ambos usen el mismo valor

### Error: "Error de conexión con la app principal"
- Verifica que `NEXT_PUBLIC_APP_URL` esté configurado correctamente en panel-control
- Asegúrate de que la app principal esté corriendo
- Verifica que el endpoint `/api/cache/clear` esté accesible

### El botón no aparece
- Verifica que hayas iniciado sesión como administrador
- Recarga la página del panel de control
- Verifica que el componente `UsersTable` esté actualizado
