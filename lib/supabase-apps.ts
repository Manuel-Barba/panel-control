import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para la base de datos de apps (apps-database)
// Esta base de datos almacena las mini-apps y plantillas subidas por la comunidad
// Es diferente a la base de datos principal del panel de control

const supabaseAppsUrl = process.env.NEXT_PUBLIC_SUPABASE_APPS_URL
const supabaseAppsAnonKey = process.env.NEXT_PUBLIC_SUPABASE_APPS_ANON_KEY

// Verificar que las variables de entorno estén configuradas
if (!supabaseAppsUrl || !supabaseAppsAnonKey) {
  console.warn('⚠️ Variables de entorno para apps-database no configuradas:')
  console.warn('  - NEXT_PUBLIC_SUPABASE_APPS_URL')
  console.warn('  - NEXT_PUBLIC_SUPABASE_APPS_ANON_KEY')
}

// Crear cliente solo si las variables están disponibles
export const supabaseApps = supabaseAppsUrl && supabaseAppsAnonKey
  ? createClient(supabaseAppsUrl, supabaseAppsAnonKey)
  : null
