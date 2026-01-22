import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - Obtener todas las instituciones
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('instituciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching institutions:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}
