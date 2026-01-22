import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Crear cliente con valores por defecto para evitar errores durante el build
// Las verificaciones se harán en tiempo de ejecución cuando se use el cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función helper para verificar configuración en tiempo de ejecución
export function verifySupabaseConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurado')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado')
  }
}
