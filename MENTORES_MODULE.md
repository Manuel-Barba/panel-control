# 📚 Módulo de Gestión de Mentores

## 🎯 Descripción

El módulo de mentores permite administrar y supervisar todos los mentores registrados en la plataforma, así como gestionar las solicitudes de reuniones que reciben.

## ✨ Funcionalidades Implementadas

### 📊 Dashboard de Estadísticas
- **Total de Mentores**: Contador de todos los mentores registrados
- **Mentores Verificados**: Mentores con cuenta verificada
- **Mentores Disponibles**: Mentores con disponibilidad activa
- **Total de Solicitudes**: Solicitudes de reuniones recibidas
- **Solicitudes Pendientes**: Solicitudes que requieren atención
- **Solicitudes Completadas**: Reuniones ya realizadas

### 👥 Gestión de Mentores
- **Lista Completa**: Visualización de todos los mentores con información detallada
- **Filtros Avanzados**:
  - Búsqueda por nombre, email, empresa o especialidad
  - Filtro por disponibilidad (Disponible, Ocupado, No disponible)
  - Filtro por estado de verificación (Verificados, No verificados)
- **Información Detallada**:
  - Datos personales y profesionales
  - Especialidades y años de experiencia
  - Ubicación e idiomas
  - Biografía y enlaces de LinkedIn
  - Conteo de solicitudes recibidas

### 📅 Gestión de Solicitudes de Reuniones
- **Lista de Solicitudes**: Todas las solicitudes con información completa
- **Filtros de Búsqueda**: Por mentor, contacto, tema o equipo
- **Estados de Solicitud**:
  - 🟡 Pendiente
  - 🟢 Aprobada
  - 🔴 Rechazada
  - 🔵 Completada
- **Información Detallada**:
  - Datos del mentor y contacto
  - Tema y fecha de la reunión
  - Enlaces de reunión (cuando estén disponibles)
  - Estado y fecha de creación

### 🔍 Modal de Detalles del Mentor
- **Vista Completa**: Información detallada del mentor seleccionado
- **Especialidades**: Lista completa de especialidades
- **Idiomas**: Idiomas que maneja el mentor
- **Estadísticas**: Conteo de solicitudes totales y pendientes
- **Enlaces Externos**: Acceso directo a LinkedIn

## 🗄️ Tablas Utilizadas

### Tabla `mentores`
- **Campos Principales**:
  - `id`: Identificador único
  - `email`: Correo electrónico
  - `name`: Nombre completo
  - `verified`: Estado de verificación
  - `title`: Título profesional
  - `company`: Empresa
  - `experience_years`: Años de experiencia
  - `specialties`: Array de especialidades
  - `location`: Ubicación
  - `availability`: Estado de disponibilidad
  - `languages`: Array de idiomas
  - `bio`: Biografía
  - `avatar_url`: URL del avatar
  - `linkedin_url`: URL de LinkedIn

### Tabla `mentor_meeting_requests`
- **Campos Principales**:
  - `id`: Identificador único
  - `mentor_id`: ID del mentor
  - `from_team`: Equipo solicitante
  - `contact_name`: Nombre del contacto
  - `topic`: Tema de la reunión
  - `date`: Fecha de la reunión
  - `time`: Hora de la reunión
  - `status`: Estado de la solicitud
  - `meeting_link`: Enlace de la reunión
  - `created_at`: Fecha de creación

## 🎨 Características de la Interfaz

### 📱 Diseño Responsivo
- **Desktop**: Vista completa con todas las funcionalidades
- **Tablet**: Adaptación de columnas y espaciado
- **Mobile**: Navegación optimizada y contenido apilado

### 🎯 Navegación por Tabs
- **Tab Mentores**: Gestión completa de mentores
- **Tab Solicitudes**: Gestión de solicitudes de reuniones

### 🔍 Búsqueda y Filtros
- **Búsqueda Global**: Busca en múltiples campos simultáneamente
- **Filtros Específicos**: Filtros por estado y características
- **Resultados en Tiempo Real**: Actualización instantánea de resultados

### 🎨 Estados Visuales
- **Colores de Estado**: Código de colores para diferentes estados
- **Iconos Descriptivos**: Iconos que facilitan la identificación
- **Hover Effects**: Efectos visuales al interactuar

## 🚀 Cómo Usar

### 1. Acceder al Módulo
- Desde el sidebar, hacer clic en "Mentores"
- O desde el dashboard, hacer clic en "Ir a Gestión de Mentores"

### 2. Gestionar Mentores
- **Ver Lista**: Todos los mentores aparecen en la primera tab
- **Filtrar**: Usar los filtros de búsqueda y estado
- **Ver Detalles**: Hacer clic en el ícono de ojo para ver detalles completos
- **Acceder a LinkedIn**: Hacer clic en el ícono de enlace externo

### 3. Gestionar Solicitudes
- **Cambiar Tab**: Hacer clic en "Solicitudes de Reuniones"
- **Filtrar**: Usar la búsqueda para encontrar solicitudes específicas
- **Ver Detalles**: Cada solicitud muestra información completa del mentor y contacto

### 4. Actualizar Datos
- **Botón Actualizar**: Hacer clic en "Actualizar" para refrescar todos los datos
- **Datos en Tiempo Real**: Los datos se actualizan automáticamente

## 🔧 Configuración Técnica

### Dependencias
- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **Supabase**: Base de datos
- **Lucide React**: Iconos

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Permisos de Base de Datos
- **Lectura**: Acceso a tablas `mentores` y `mentor_meeting_requests`
- **Joins**: Relaciones entre mentores y solicitudes
- **Agregaciones**: Conteo de solicitudes por mentor

## 📈 Métricas Disponibles

### Estadísticas de Mentores
- Total de mentores registrados
- Porcentaje de mentores verificados
- Distribución por disponibilidad
- Promedio de solicitudes por mentor

### Estadísticas de Solicitudes
- Total de solicitudes recibidas
- Distribución por estado
- Solicitudes pendientes vs completadas
- Tendencias temporales

## 🎉 ¡Listo para Usar!

El módulo de mentores está completamente funcional y listo para administrar la plataforma de mentores de Hablemos Emprendimiento. Proporciona una vista completa y herramientas de gestión para supervisar tanto a los mentores como a las solicitudes de reuniones.
