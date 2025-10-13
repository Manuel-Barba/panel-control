import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar credenciales usando la función de la base de datos
    const { data, error } = await supabase.rpc('verify_admin_credentials', {
      p_username: username,
      p_password: password
    })

    if (error) {
      console.error('Error verificando credenciales:', error)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      
      // Verificar si es un error de función no encontrada
      if (error.message && error.message.includes('function verify_admin_credentials')) {
        return NextResponse.json(
          { success: false, error: 'Función de autenticación no configurada. Contacta al administrador.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log('No se encontraron credenciales válidas para usuario:', username)
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const adminUser = data[0]

    // Actualizar último login
    const { error: updateError } = await supabase.rpc('update_admin_last_login', {
      p_admin_id: adminUser.id
    })

    if (updateError) {
      console.error('Error actualizando último login:', updateError)
      // No fallar el login por este error, solo registrar
    }

    // Generar JWT token
    const token = jwt.sign(
      { 
        adminId: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        is_active: adminUser.is_active
      }
    })

  } catch (error) {
    console.error('Error en login API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
