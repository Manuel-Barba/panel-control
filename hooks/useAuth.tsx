'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminUser {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
}

interface AuthContextType {
  user: AdminUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Verificar el token con el servidor
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        // Token inválido, limpiar localStorage
        localStorage.removeItem('admin_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      localStorage.removeItem('admin_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      // Verificar si la respuesta es JSON válido
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parseando JSON:', jsonError)
        return { 
          success: false, 
          error: response.status === 404 ? 'Endpoint no encontrado' : 'Error de servidor' 
        }
      }

      if (response.ok && data.success) {
        // Guardar token en localStorage
        localStorage.setItem('admin_token', data.token)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Error de autenticación' }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: 'Error de conexión' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
