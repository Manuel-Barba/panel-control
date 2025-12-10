# Módulo de Comunicaciones

Este módulo permite gestionar el envío de emails transaccionales (vía Resend) y notificaciones in-app a usuarios y mentores desde el panel de control.

## Características

### 📧 Emails con Resend

- **Envío masivo**: A todos los usuarios o filtrados por tipo de cuenta
- **Filtros disponibles**:
  - Todos los usuarios
  - Solo usuarios Free
  - Solo usuarios Pro
  - Solo mentores
  - Usuarios específicos (selección manual)
- **Soporte HTML y texto plano**
- **Vista previa en tiempo real** del contenido HTML
- **Templates predefinidos** para casos de uso comunes

### 🔔 Notificaciones In-App

- **Notificaciones a usuarios**: Tabla `notifications`
- **Notificaciones a mentores**: Tabla `mentor_notifications`
- **Tipos de notificación**:
  - General
  - Sistema
  - Anuncio
  - Recordatorio
  - Alerta
- **Prioridades**: Baja, Normal, Alta, Urgente
- **URL de acción** opcional
- **Fecha de expiración** opcional

## Configuración de Resend

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Verifica tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Crea una nueva API Key
3. Copia la key (comienza con `re_`)

### 3. Configurar variables de entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
# API Key de Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email remitente (opcional, por defecto usa onboarding@resend.dev)
RESEND_FROM_EMAIL=Hablemos Emprendimiento <noreply@hablemosemprendimiento.com>
```

### 4. Verificar dominio (producción)

Para enviar emails desde tu propio dominio:

1. En Resend, ve a **Domains**
2. Agrega tu dominio
3. Configura los registros DNS (MX, SPF, DKIM)
4. Espera la verificación

> **Nota**: Con el dominio de prueba (`onboarding@resend.dev`) solo puedes enviar emails a direcciones verificadas en tu cuenta de Resend.

## Estructura de archivos

```
panel-control/
├── app/
│   └── api/
│       ├── email/
│       │   ├── send/
│       │   │   └── route.ts      # API para enviar emails
│       │   └── config/
│       │       └── route.ts      # API para verificar configuración
│       └── notifications/
│           └── send/
│               └── route.ts      # API para enviar notificaciones
├── components/
│   └── ComunicacionesModule.tsx  # Componente principal
```

## APIs

### POST /api/email/send

Envía un email a uno o más destinatarios.

**Request body:**
```json
{
  "to": ["email@ejemplo.com"],
  "subject": "Asunto del email",
  "html": "<p>Contenido HTML</p>",
  "text": "Contenido texto plano (opcional)",
  "from": "remitente@dominio.com (opcional)",
  "replyTo": "responder@dominio.com (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "..." },
  "message": "Email enviado exitosamente a 1 destinatario(s)"
}
```

### GET /api/email/config

Verifica la configuración de Resend.

**Response:**
```json
{
  "configured": true,
  "fromEmail": "noreply@dominio.com",
  "apiKeyValid": true,
  "domains": [...]
}
```

### POST /api/notifications/send

Envía notificaciones a usuarios y/o mentores.

**Request body:**
```json
{
  "userIds": ["uuid1", "uuid2"],
  "mentorIds": ["uuid3"],
  "title": "Título de la notificación",
  "message": "Mensaje de la notificación",
  "type": "general",
  "priority": "normal",
  "actionUrl": "/ruta/accion",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notificaciones enviadas exitosamente",
  "counts": {
    "users": 2,
    "mentors": 1,
    "total": 3
  }
}
```

## Templates de Email Incluidos

1. **Bienvenida**: Email de bienvenida para nuevos usuarios
2. **Upgrade a Pro**: Promoción para actualizar a cuenta Pro
3. **Nueva Funcionalidad**: Anuncio de nuevas características
4. **Recordatorio de Evento**: Invitación/recordatorio de eventos

## Esquemas de Base de Datos

### Tabla `notifications` (usuarios)

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  action_url VARCHAR(500),
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

### Tabla `mentor_notifications` (mentores)

```sql
CREATE TABLE mentor_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES mentores(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);
```

## Uso

1. Ve al panel de control
2. Haz clic en "Comunicaciones" en el menú lateral
3. Selecciona la pestaña que necesites:
   - **Emails**: Para enviar emails con Resend
   - **Notificaciones**: Para enviar notificaciones in-app
   - **Templates**: Para ver y usar plantillas de email
   - **Configuración**: Para verificar el estado de Resend

## Notas Importantes

- Los emails se envían de forma síncrona. Para grandes volúmenes, considera implementar una cola de trabajos.
- Las notificaciones a mentores requieren tipos específicos definidos en el check constraint de la tabla.
- El filtro de usuarios por tipo de cuenta depende del campo `subscription_type` en la tabla `users`.
