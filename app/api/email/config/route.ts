import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    // Fallback: usar dominio verificado directiva.mx
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@directiva.mx'
    const fromName = process.env.RESEND_FROM_NAME || 'Hablemos Emprendimiento'

    // Construir el formato completo del remitente
    const fullFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail

    if (!apiKey) {
      return NextResponse.json({
        configured: false,
        error: 'RESEND_API_KEY no está configurada. Agrega RESEND_API_KEY a tu archivo .env.local',
        fromEmail: null,
        fromName: null
      })
    }

    // Verificar que la API key es válida haciendo una petición a Resend
    const resend = new Resend(apiKey)
    
    try {
      // Intentar obtener información de la cuenta/dominios
      const { data: domains } = await resend.domains.list()
      
      return NextResponse.json({
        configured: true,
        fromEmail,
        fromName,
        fullFrom,
        domains: domains || [],
        apiKeyValid: true,
        isTestDomain: fromEmail === 'onboarding@resend.dev',
        isProductionDomain: fromEmail.includes('@directiva.mx')
      })
    } catch (resendError: any) {
      // La API key existe pero puede ser inválida
      return NextResponse.json({
        configured: true,
        fromEmail,
        fromName,
        fullFrom,
        apiKeyValid: false,
        error: resendError.message || 'API Key inválida o sin permisos',
        isTestDomain: fromEmail === 'onboarding@resend.dev',
        isProductionDomain: fromEmail.includes('@directiva.mx')
      })
    }

  } catch (error) {
    console.error('Error verificando configuración:', error)
    return NextResponse.json(
      { 
        configured: false,
        error: error instanceof Error ? error.message : 'Error verificando configuración'
      },
      { status: 500 }
    )
  }
}
