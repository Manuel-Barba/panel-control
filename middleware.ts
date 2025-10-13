import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Solo proteger la página principal
  if (request.nextUrl.pathname === '/') {
    // Verificar si hay token en localStorage (esto se maneja en el cliente)
    return NextResponse.next()
  }

  // Permitir acceso a login y APIs
  return NextResponse.next()
}

export const config = {
  matcher: ['/']
}