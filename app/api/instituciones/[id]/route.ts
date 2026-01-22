import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PUT - Actualizar estado de una institución
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, approved_at, max_users } = body

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (approved_at) {
      updateData.approved_at = approved_at
    }

    if (max_users !== undefined) {
      updateData.max_users = max_users
    }

    const { data, error } = await supabaseAdmin
      .from('instituciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating institution:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una institución
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('instituciones')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting institution:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}
