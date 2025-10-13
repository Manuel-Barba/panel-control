# Panel de Control - Hablemos Emprendimiento

Panel de administración para monitorear y gestionar la aplicación Hablemos Emprendimiento.

## Características

- **Dashboard Principal**: Estadísticas en tiempo real de usuarios
- **Gestión de Usuarios**: Visualización y control de tipos de cuenta (PRO/Gratuito)
- **Módulo de Mentores**: Preparado para futuras funcionalidades
- **Diseño Responsivo**: Funciona en desktop y móvil

## Configuración

### 1. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 3. Ejecutar el proyecto

```bash
npm run dev
# o
pnpm dev
```

El panel estará disponible en `http://localhost:3000`

## Funcionalidades

### Dashboard
- **Total de Usuarios**: Contador de todos los usuarios registrados
- **Usuarios PRO**: Usuarios con suscripción activa
- **Usuarios Gratuitos**: Usuarios con cuenta gratuita
- **Nuevos Hoy**: Usuarios registrados en el día actual

### Gestión de Usuarios
- Lista de usuarios recientes
- Cambio de tipo de cuenta (PRO ↔ Gratuito)
- Información de fecha de registro
- Actualización en tiempo real

### Base de Datos
El panel se conecta a la base de datos Supabase `impulsa-ia-db` y utiliza la tabla `users` con los siguientes campos:
- `id`: Identificador único
- `email`: Correo del usuario
- `account_type`: Tipo de cuenta ('free' o 'pro')
- `created_at`: Fecha de registro
- `updated_at`: Fecha de última actualización

## Estructura del Proyecto

```
panel-control/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DashboardStats.tsx
│   ├── Sidebar.tsx
│   └── UsersTable.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── package.json
```

## Tecnologías Utilizadas

- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **Supabase**: Base de datos y autenticación
- **Lucide React**: Iconos
