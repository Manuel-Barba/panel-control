import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
// URL de la app principal - ajusta según tu configuración
const MAIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.MAIN_APP_URL || 'http://localhost:3000'

/**
 * Endpoint del panel de control para limpiar caché de usuarios
 * Verifica autenticación de admin y llama al endpoint de la app principal
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remover "Bearer "

    // Verificar y decodificar el JWT
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
      
      if (decoded.type !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Token inválido: no es un token de administrador' },
          { status: 401 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Obtener datos del request
    const { userId, userEmail, clearAll } = await request.json().catch(() => ({}))
    
    if (!userId && !clearAll) {
      return NextResponse.json(
        { success: false, error: 'Se requiere userId o clearAll=true' },
        { status: 400 }
      )
    }

    // Llamar al endpoint de la app principal para limpiar caché
    try {
      const mainAppResponse = await fetch(`${MAIN_APP_URL}/api/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token, // Pasar el token de admin
        },
        body: JSON.stringify({
          userId,
          userEmail,
          clearAll
        })
      })

      const mainAppData = await mainAppResponse.json()

      if (!mainAppResponse.ok) {
        return NextResponse.json(
          { 
            success: false, 
            error: mainAppData.error || 'Error al limpiar caché en la app principal' 
          },
          { status: mainAppResponse.status }
        )
      }

      // Log de la acción
      console.log(`[PANEL CONTROL] Admin ${decoded.adminId} limpió caché:`, {
        userId: userId || 'all',
        userEmail: userEmail || 'N/A',
        clearAll: clearAll || false,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'Caché limpiado exitosamente',
        data: mainAppData,
        timestamp: new Date().toISOString()
      })

    } catch (fetchError) {
      console.error('Error llamando a la app principal:', fetchError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error de conexión con la app principal. Verifica que MAIN_APP_URL esté configurado correctamente.' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en clear-user endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
