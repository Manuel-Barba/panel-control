import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Validar y obtener variables de entorno al inicio del módulo
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET
const MAIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.MAIN_APP_URL

// Validación de configuración al cargar el módulo
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-this-in-production') {
  console.error('[PANEL CONTROL] ⚠️  JWT_SECRET no está configurado o usa valor por defecto')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET debe estar configurado en producción')
  }
}

if (!MAIN_APP_URL || MAIN_APP_URL === 'http://localhost:3000') {
  console.error('[PANEL CONTROL] ⚠️  MAIN_APP_URL no está configurado o usa valor por defecto')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MAIN_APP_URL debe estar configurado en producción')
  }
}

// Validar formato de URL
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Constantes de configuración
const FETCH_TIMEOUT_MS = 30000 // 30 segundos
const MAX_RETRIES = 3
const RETRY_DELAY_BASE_MS = 1000 // 1 segundo base para exponential backoff

/**
 * Función helper para hacer fetch con retry y exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const fetchOptions = {
      ...options,
      signal: controller.signal
    }

    try {
      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      lastError = error
      
      // Si es el último intento o el error no es recuperable, lanzar error
      if (attempt === maxRetries || 
          (error.name !== 'AbortError' && !error.message?.includes('fetch failed'))) {
        throw error
      }
      
      // Exponential backoff: esperar antes del siguiente intento
      const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1)
      console.log(`[PANEL CONTROL] Reintento ${attempt}/${maxRetries} después de ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError || new Error('Todos los reintentos fallaron')
}

/**
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar formato de UUID (formato común de IDs en Supabase)
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Sanitizar string para prevenir inyección
 */
function sanitizeString(input: string): string {
  return input.trim().slice(0, 500) // Limitar longitud
}

/**
 * Endpoint del panel de control para limpiar caché de usuarios
 * Verifica autenticación de admin y llama al endpoint de la app principal
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    // Validar configuración
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-this-in-production') {
      console.error(`[${requestId}] JWT_SECRET no configurado`)
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incorrecta' },
        { status: 500 }
      )
    }

    if (!MAIN_APP_URL || !isValidUrl(MAIN_APP_URL)) {
      console.error(`[${requestId}] MAIN_APP_URL no configurado o inválido:`, MAIN_APP_URL)
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incorrecta' },
        { status: 500 }
      )
    }

    // Verificar autenticación de admin
    // Intentar leer el header en diferentes formatos (case-insensitive)
    const authHeader = request.headers.get('authorization') || 
                       request.headers.get('Authorization') ||
                       request.headers.get('AUTHORIZATION')
    
    // Log para debugging
    console.log(`[${requestId}] Headers recibidos:`, {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'No header',
      allHeaders: Object.fromEntries(request.headers.entries())
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Intento de acceso sin token válido`, {
        authHeader: authHeader ? authHeader.substring(0, 30) : 'null',
        headersKeys: Array.from(request.headers.keys())
      })
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7).trim()
    
    if (!token || token.length < 10) {
      console.warn(`[${requestId}] Token inválido (muy corto)`)
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar y decodificar el JWT
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
      
      if (!decoded || decoded.type !== 'admin') {
        console.warn(`[${requestId}] Token no es de tipo admin`)
        return NextResponse.json(
          { success: false, error: 'Token inválido: no es un token de administrador' },
          { status: 401 }
        )
      }
    } catch (error: any) {
      console.warn(`[${requestId}] Error verificando token:`, error.name)
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Obtener y validar datos del request
    let requestBody: any
    try {
      requestBody = await request.json()
    } catch (error) {
      console.warn(`[${requestId}] Error parseando body JSON`)
      return NextResponse.json(
        { success: false, error: 'Body JSON inválido' },
        { status: 400 }
      )
    }
    
    const { userId, userEmail, clearAll } = requestBody
    
    // Validar que se proporcione al menos userId o clearAll
    if (!userId && !clearAll) {
      return NextResponse.json(
        { success: false, error: 'Se requiere userId o clearAll=true' },
        { status: 400 }
      )
    }

    // Validar formato de userId si se proporciona
    if (userId && typeof userId === 'string' && !isValidUUID(userId) && userId.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Formato de userId inválido' },
        { status: 400 }
      )
    }

    // Validar y sanitizar email si se proporciona
    let sanitizedEmail: string | undefined
    if (userEmail) {
      if (typeof userEmail !== 'string') {
        return NextResponse.json(
          { success: false, error: 'userEmail debe ser un string' },
          { status: 400 }
        )
      }
      sanitizedEmail = sanitizeString(userEmail)
      if (!isValidEmail(sanitizedEmail)) {
        return NextResponse.json(
          { success: false, error: 'Formato de email inválido' },
          { status: 400 }
        )
      }
    }

    // Validar clearAll si se proporciona
    if (clearAll !== undefined && typeof clearAll !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'clearAll debe ser un booleano' },
        { status: 400 }
      )
    }

    // Llamar al endpoint de la app principal para limpiar caché
    try {
      const url = `${MAIN_APP_URL}/api/cache/clear`
      console.log(`[${requestId}] Llamando a la app principal: ${url}`)
      
      // Preparar body sanitizado
      const requestBody = {
        ...(userId && { userId: sanitizeString(String(userId)) }),
        ...(sanitizedEmail && { userEmail: sanitizedEmail }),
        ...(clearAll !== undefined && { clearAll: Boolean(clearAll) })
      }
      
      // Hacer fetch con retry logic
      const mainAppResponse = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
          'User-Agent': 'Panel-Control/1.0',
        },
        body: JSON.stringify(requestBody)
      })

      // Intentar parsear la respuesta JSON
      let mainAppData: any
      try {
        const contentType = mainAppResponse.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          mainAppData = await mainAppResponse.json()
        } else {
          const text = await mainAppResponse.text()
          mainAppData = text ? { raw: text } : {}
        }
      } catch (parseError: any) {
        console.error(`[${requestId}] Error parseando respuesta:`, parseError.message)
        return NextResponse.json(
          { 
            success: false, 
            error: `Error en respuesta de la app principal (status: ${mainAppResponse.status})` 
          },
          { status: 500 }
        )
      }

      if (!mainAppResponse.ok) {
        const statusCode = mainAppResponse.status
        console.error(`[${requestId}] Error de la app principal (${statusCode}):`, {
          error: mainAppData.error,
          status: statusCode
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: mainAppData.error || `Error al limpiar caché en la app principal (status: ${statusCode})` 
          },
          { 
            status: statusCode >= 400 && statusCode < 500 ? statusCode : 500 
          }
        )
      }

      // Log de éxito estructurado
      const duration = Date.now() - startTime
      console.log(`[${requestId}] ✅ Caché limpiado exitosamente:`, {
        adminId: decoded.adminId,
        userId: userId || 'all',
        userEmail: sanitizedEmail || 'N/A',
        clearAll: clearAll || false,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'Caché limpiado exitosamente',
        data: mainAppData,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${duration}ms`
        }
      })

    } catch (fetchError: any) {
      const duration = Date.now() - startTime
      
      console.error(`[${requestId}] ❌ Error llamando a la app principal:`, {
        error: fetchError.message,
        name: fetchError.name,
        duration: `${duration}ms`,
        MAIN_APP_URL
      })
      
      // Determinar el tipo de error con mensajes más específicos
      let errorMessage = 'Error de conexión con la app principal'
      let statusCode = 500
      
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        errorMessage = 'Timeout al conectar con la app principal. El servicio puede estar sobrecargado o no disponible.'
        statusCode = 504 // Gateway Timeout
      } else if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED') {
        errorMessage = `No se pudo conectar con la app principal. Verifica que el servicio esté disponible en ${MAIN_APP_URL}`
        statusCode = 502 // Bad Gateway
      } else if (fetchError.message?.includes('network')) {
        errorMessage = 'Error de red al conectar con la app principal'
        statusCode = 503 // Service Unavailable
      } else if (fetchError.message) {
        errorMessage = `Error de conexión: ${fetchError.message}`
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          requestId
        },
        { 
          status: statusCode,
          headers: {
            'X-Request-ID': requestId,
            'X-Response-Time': `${duration}ms`
          }
        }
      )
    }

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] ❌ Error inesperado en clear-user endpoint:`, {
      error: error.message,
      name: error.name,
      stack: error.stack,
      duration: `${duration}ms`
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        requestId
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${duration}ms`
        }
      }
    )
  }
}
