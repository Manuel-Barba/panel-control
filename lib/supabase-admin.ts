import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Usar la service role key para bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Crear cliente con valores por defecto para evitar errores durante el build
// Las verificaciones se harán en tiempo de ejecución cuando se use el cliente
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Función helper para verificar configuración en tiempo de ejecución
export function verifySupabaseAdminConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurado')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurado')
  }
}
