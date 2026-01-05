'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react'

// IDs de usuarios a excluir de las estadísticas
const EXCLUDED_USER_IDS = [
  "9f3344cc-c9e2-41ac-9fec-579d2d5f9c6c",
  "8b7ee356-42a4-41c5-be93-5fecd861037f",
  "8ea2524e-9e62-46e0-9857-40005d73ccf3",
  "878864c3-9580-46c4-882e-34307c817bc0"
]

interface UserStats {
  totalUsers: number
  proUsers: number
  freeUsers: number
  newUsersToday: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    newUsersToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Obtener todos los usuarios
      const { data: users, error } = await supabase
        .from('users')
        .select('id, account_type, created_at')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      if (users) {
        // Filtrar usuarios excluidos
        const filteredUsers = users.filter(user => !EXCLUDED_USER_IDS.includes(user.id))
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const newUsersToday = filteredUsers.filter(user => {
          const userDate = new Date(user.created_at)
          userDate.setHours(0, 0, 0, 0)
          return userDate.getTime() === today.getTime()
        }).length

        const proUsers = filteredUsers.filter(user => user.account_type === 'pro').length
        const freeUsers = filteredUsers.filter(user => user.account_type === 'free').length

        setStats({
          totalUsers: filteredUsers.length,
          proUsers,
          freeUsers,
          newUsersToday
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Usuarios registrados'
    },
    {
      title: 'Usuarios PRO',
      value: stats.proUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      description: 'Suscripciones activas'
    },
    {
      title: 'Usuarios Gratuitos',
      value: stats.freeUsers,
      icon: UserX,
      color: 'bg-yellow-500',
      description: 'Cuentas gratuitas'
    },
    {
      title: 'Nuevos Hoy',
      value: stats.newUsersToday,
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Registros de hoy'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
