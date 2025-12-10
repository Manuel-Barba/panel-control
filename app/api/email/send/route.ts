import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Inicializar Resend con la API key del environment
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
      to, 
      subject, 
      html, 
      text,
      from,
      replyTo,
      cc,
      bcc,
      tags 
    } = body

    // Validaciones básicas
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: to, subject y (html o text)' },
        { status: 400 }
      )
    }

    const resend = getResend()

    // Preparar destinatarios (puede ser array o string)
    const recipients = Array.isArray(to) ? to : [to]

    // Email por defecto desde environment o usar fallback
    // Soporta formato separado (RESEND_FROM_EMAIL + RESEND_FROM_NAME) o combinado
    let fromEmail = from
    if (!fromEmail) {
      // Fallback: usar dominio verificado directiva.mx si no está configurado
      const email = process.env.RESEND_FROM_EMAIL || 'noreply@directiva.mx'
      const name = process.env.RESEND_FROM_NAME || 'Hablemos Emprendimiento'
      fromEmail = name ? `${name} <${email}>` : email
    }

    const emailData: any = {
      from: fromEmail,
      to: recipients,
      subject,
    }

    if (html) emailData.html = html
    if (text) emailData.text = text
    if (replyTo) emailData.reply_to = replyTo
    if (cc) emailData.cc = Array.isArray(cc) ? cc : [cc]
    if (bcc) emailData.bcc = Array.isArray(bcc) ? bcc : [bcc]
    if (tags) emailData.tags = tags

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('Error enviando email:', error)
      return NextResponse.json(
        { error: error.message || 'Error al enviar el email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Email enviado exitosamente a ${recipients.length} destinatario(s)`
    })

  } catch (error) {
    console.error('Error en API de email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
