'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { DashboardStats } from '@/components/DashboardStats'
import { UsersTable } from '@/components/UsersTable'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { BusinessProfilesList } from '@/components/BusinessProfilesList'
import { MentoresModule } from '@/components/MentoresModule'
import { GraduationCap, RefreshCw, LogOut } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay token
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    // Verificar token con el servidor
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        localStorage.removeItem('admin_token')
        router.push('/login')
        return null
      }
    })
    .then(data => {
      if (data) {
        setUser(data.user)
      }
    })
    .catch(error => {
      console.error('Error:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    })
    .finally(() => {
      setIsLoading(false)
    })
  }, [router])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Monitorea el estado de Hablemos Emprendimiento</p>
                {user && (
                  <p className="text-sm text-gray-500 mt-1">
                    Bienvenido, {user.first_name || user.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  Actualizar Todo
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
            
            <DashboardStats key={`stats-${refreshKey}`} />
            
            {/* Nueva fila con 4 contenedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyticsCharts key={`analytics-${refreshKey}`} />
              <BusinessProfilesList key={`profiles-${refreshKey}`} />
            </div>
            
            <UsersTable key={`users-${refreshKey}`} />
          </div>
        )
      
      case 'mentores':
        return <MentoresModule />
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="ml-0 lg:ml-64">
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}