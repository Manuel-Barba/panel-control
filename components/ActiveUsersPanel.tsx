'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, Circle, RefreshCw, User, ChevronLeft, ChevronRight } from 'lucide-react'

// IDs de usuarios a excluir de las estadísticas
const EXCLUDED_USER_IDS = [
  "9f3344cc-c9e2-41ac-9fec-579d2d5f9c6c",
  "8b7ee356-42a4-41c5-be93-5fecd861037f",
  "8ea2524e-9e62-46e0-9857-40005d73ccf3"
]

interface UserActivity {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  account_type: 'free' | 'pro'
  last_active: string | null
  business_name: string | null
}

interface ActiveUsersStats {
  totalActive: number
  activeNow: number
  activeToday: number
  activeThisWeek: number
}

export function ActiveUsersPanel() {
  const [users, setUsers] = useState<UserActivity[]>([])
  const [stats, setStats] = useState<ActiveUsersStats>({
    totalActive: 0,
    activeNow: 0,
    activeToday: 0,
    activeThisWeek: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5

  useEffect(() => {
    fetchActiveUsers()
    
    // Auto-refrescar cada 30 segundos
    const intervalId = setInterval(fetchActiveUsers, 30 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  const fetchActiveUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else if (!refreshing) {
        setLoading(true)
      }

      // Obtener usuarios con su última actividad
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, account_type, last_active, business_name')
        .not('last_active', 'is', null)
        .order('last_active', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching active users:', error)
        return
      }

      if (data) {
        setUsers(data)
        calculateStats(data)
        // Resetear a la primera página si cambian los datos
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateStats = (userData: UserActivity[]) => {
    // Filtrar usuarios excluidos para las estadísticas
    const filteredUserData = userData.filter(user => !EXCLUDED_USER_IDS.includes(user.id))
    
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const activeNow = filteredUserData.filter(user => {
      if (!user.last_active) return false
      return new Date(user.last_active) >= fiveMinutesAgo
    }).length

    const activeToday = filteredUserData.filter(user => {
      if (!user.last_active) return false
      return new Date(user.last_active) >= today
    }).length

    const activeThisWeek = filteredUserData.filter(user => {
      if (!user.last_active) return false
      return new Date(user.last_active) >= weekAgo
    }).length

    setStats({
      totalActive: filteredUserData.length,
      activeNow,
      activeToday,
      activeThisWeek
    })
  }

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { status: 'offline', label: 'Sin actividad', color: 'bg-gray-400' }
    
    const lastActiveDate = new Date(lastActive)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60))

    if (diffMinutes <= 5) {
      return { status: 'online', label: 'En línea', color: 'bg-green-500' }
    } else if (diffMinutes <= 30) {
      return { status: 'recent', label: 'Hace ' + diffMinutes + ' min', color: 'bg-yellow-500' }
    } else if (diffMinutes <= 60) {
      return { status: 'away', label: 'Hace ~1 hora', color: 'bg-orange-400' }
    } else {
      return { status: 'offline', label: formatTimeAgo(lastActiveDate), color: 'bg-gray-400' }
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    } else if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatLastActive = (lastActive: string | null) => {
    if (!lastActive) return 'Nunca'
    
    return new Date(lastActive).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calcular paginación
  const totalPages = Math.ceil(users.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = users.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Usuarios Activos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitoreo en tiempo real de la actividad de usuarios
          </p>
        </div>
        <button
          onClick={() => fetchActiveUsers(true)}
          disabled={refreshing}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">En línea ahora</span>
          </div>
          <p className="text-3xl font-bold text-green-800">{stats.activeNow}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Activos hoy</span>
          </div>
          <p className="text-3xl font-bold text-blue-800">{stats.activeToday}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Esta semana</span>
          </div>
          <p className="text-3xl font-bold text-purple-800">{stats.activeThisWeek}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Con actividad</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalActive}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Negocio</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Última Actividad</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const activityStatus = getActivityStatus(user.last_active)
              return (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${activityStatus.color} ${activityStatus.status === 'online' ? 'animate-pulse' : ''}`}></div>
                      <span className={`text-xs font-medium ${
                        activityStatus.status === 'online' ? 'text-green-600' :
                        activityStatus.status === 'recent' ? 'text-yellow-600' :
                        activityStatus.status === 'away' ? 'text-orange-500' :
                        'text-gray-500'
                      }`}>
                        {activityStatus.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900 font-medium">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Sin nombre'}
                      </p>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {user.business_name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      user.account_type === 'pro'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {user.account_type === 'pro' ? 'PRO' : 'FREE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {formatLastActive(user.last_active)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay usuarios con actividad registrada</p>
          <p className="text-sm mt-1">Los usuarios aparecerán aquí cuando inicien sesión</p>
        </div>
      )}

      {/* Paginación */}
      {users.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} - {Math.min(endIndex, users.length)} de {users.length} usuarios
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <div className="px-4 py-1.5 text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

