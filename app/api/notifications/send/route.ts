import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Crear cliente de Supabase
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Variables de Supabase no configuradas')
  }
  
  return createClient(url, key)
}

// Inicializar Resend
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurada')
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userIds, 
      mentorIds,
      title, 
      message, 
      type = 'general',
      priority = 'normal',
      actionUrl,
      expiresAt,
      metadata = {},
      sendEmail = false
    } = body

    // Validaciones
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título y mensaje son obligatorios' },
        { status: 400 }
      )
    }

    if ((!userIds || userIds.length === 0) && (!mentorIds || mentorIds.length === 0)) {
      return NextResponse.json(
        { error: 'Debe especificar al menos un usuario o mentor' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    let userNotificationsCount = 0
    let mentorNotificationsCount = 0
    let emailSentCount = 0
    let emailError: string | null = null

    // Obtener emails si se debe enviar correo
    let recipientEmails: string[] = []
    if (sendEmail) {
      try {
        // Obtener emails de usuarios
        if (userIds && userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email')
            .in('id', userIds)
            .eq('is_active', true)
            .is('deleted_at', null)

          if (!usersError && users) {
            recipientEmails.push(...users.map((u: any) => u.email).filter(Boolean))
          }
        }

        // Obtener emails de mentores
        if (mentorIds && mentorIds.length > 0) {
          const { data: mentors, error: mentorsError } = await supabase
            .from('mentores')
            .select('email')
            .in('id', mentorIds)

          if (!mentorsError && mentors) {
            recipientEmails.push(...mentors.map((m: any) => m.email).filter(Boolean))
          }
        }

        // Eliminar duplicados
        recipientEmails = [...new Set(recipientEmails.map(e => e.toLowerCase()))]
      } catch (emailFetchError) {
        console.error('Error obteniendo emails:', emailFetchError)
        emailError = 'No se pudieron obtener los emails de los destinatarios'
      }
    }

    // Enviar notificaciones a usuarios
    if (userIds && userIds.length > 0) {
      const userNotifications = userIds.map((userId: string) => ({
        user_id: userId,
        title,
        message,
        type,
        priority,
        action_url: actionUrl || null,
        expires_at: expiresAt || null,
        metadata,
        read: false
      }))

      const { error: userError } = await supabase
        .from('notifications')
        .insert(userNotifications)

      if (userError) {
        console.error('Error insertando notificaciones de usuarios:', userError)
        throw new Error(`Error enviando notificaciones a usuarios: ${userError.message}`)
      }

      userNotificationsCount = userIds.length
    }

    // Enviar notificaciones a mentores
    if (mentorIds && mentorIds.length > 0) {
      // Mapear el tipo de notificación para mentores
      const mentorType = type === 'general' ? 'new_meeting_request' : type
      
      const mentorNotifications = mentorIds.map((mentorId: string) => ({
        mentor_id: mentorId,
        title,
        message,
        type: mentorType,
        data: metadata,
        is_read: false
      }))

      const { error: mentorError } = await supabase
        .from('mentor_notifications')
        .insert(mentorNotifications)

      if (mentorError) {
        console.error('Error insertando notificaciones de mentores:', mentorError)
        throw new Error(`Error enviando notificaciones a mentores: ${mentorError.message}`)
      }

      mentorNotificationsCount = mentorIds.length
    }

    // Enviar correos si se solicitó y hay destinatarios
    if (sendEmail && recipientEmails.length > 0) {
      try {
        const resend = getResend()
        const email = process.env.RESEND_FROM_EMAIL || 'noreply@directiva.mx'
        const name = process.env.RESEND_FROM_NAME || 'Hablemos Emprendimiento'
        const fromEmail = name ? `${name} <${email}>` : email

        // Crear contenido HTML del email
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; margin-bottom: 20px;">${title}</h1>
            <div style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Ver más</a>` : ''}
          </div>
        `

        const textContent = `${title}\n\n${message}${actionUrl ? `\n\nVer más: ${actionUrl}` : ''}`

        const { data, error: emailSendError } = await resend.emails.send({
          from: fromEmail,
          to: recipientEmails,
          subject: title,
          html: htmlContent,
          text: textContent
        })

        if (emailSendError) {
          console.error('Error enviando emails:', emailSendError)
          emailError = `Error al enviar correos: ${emailSendError.message}`
        } else {
          emailSentCount = recipientEmails.length
        }
      } catch (emailSendError) {
        console.error('Error en envío de emails:', emailSendError)
        emailError = emailSendError instanceof Error 
          ? emailSendError.message 
          : 'Error desconocido al enviar correos'
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas exitosamente',
      counts: {
        users: userNotificationsCount,
        mentors: mentorNotificationsCount,
        total: userNotificationsCount + mentorNotificationsCount
      },
      email: sendEmail ? {
        sent: emailSentCount,
        total: recipientEmails.length,
        error: emailError || undefined
      } : undefined
    })

  } catch (error) {
    console.error('Error en API de notificaciones:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
