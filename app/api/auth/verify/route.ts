import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remover "Bearer "

    // Verificar y decodificar el JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener información actualizada del usuario
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, email, first_name, last_name, is_active')
      .eq('id', decoded.adminId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data
    })

  } catch (error) {
    console.error('Error verificando token:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
