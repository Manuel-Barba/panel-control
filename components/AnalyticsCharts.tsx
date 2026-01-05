'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreditCard, TrendingUp, Users } from 'lucide-react'

// IDs de usuarios a excluir de las estadísticas
const EXCLUDED_USER_IDS = [
  "9f3344cc-c9e2-41ac-9fec-579d2d5f9c6c",
  "8b7ee356-42a4-41c5-be93-5fecd861037f",
  "8ea2524e-9e62-46e0-9857-40005d73ccf3",
  "878864c3-9580-46c4-882e-34307c817bc0"
]

interface AnalyticsData {
  paidUsersPercentage: number
  freeUsersPercentage: number
  paidUsersCount: number
  freeUsersCount: number
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData>({
    paidUsersPercentage: 0,
    freeUsersPercentage: 0,
    paidUsersCount: 0,
    freeUsersCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Obtener total de usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, account_type')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return
      }

      // Filtrar usuarios excluidos
      const filteredUsers = users?.filter(user => !EXCLUDED_USER_IDS.includes(user.id)) || []
      const totalUsers = filteredUsers.length

      if (totalUsers === 0) {
        setData({
          paidUsersPercentage: 0,
          freeUsersPercentage: 0,
          paidUsersCount: 0,
          freeUsersCount: 0
        })
        return
      }

      // Porcentaje de usuarios de paga vs gratuitos
      const paidUsers = filteredUsers.filter(user => user.account_type === 'pro').length
      const freeUsers = filteredUsers.filter(user => user.account_type === 'free').length

      setData({
        paidUsersPercentage: Math.round((paidUsers / totalUsers) * 100),
        freeUsersPercentage: Math.round((freeUsers / totalUsers) * 100),
        paidUsersCount: paidUsers,
        freeUsersCount: freeUsers
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartCards = [
    {
      title: 'Usuarios de Paga',
      percentage: data.paidUsersPercentage,
      count: data.paidUsersCount,
      icon: CreditCard,
      color: 'bg-green-500',
      description: 'Suscripciones PRO activas'
    },
    {
      title: 'Usuarios Gratuitos',
      percentage: data.freeUsersPercentage,
      count: data.freeUsersCount,
      icon: Users,
      color: 'bg-gray-500',
      description: 'Cuentas gratuitas'
    }
  ]

  if (loading) {
    return (
      <>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {chartCards.map((chart, index) => {
        const Icon = chart.icon
        return (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{chart.title}</h3>
              <div className="p-2 rounded-full bg-gray-100">
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{chart.count}</span>
              <span className="text-lg text-gray-600">({chart.percentage}%)</span>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">{chart.description}</p>
            
            {/* Barra de progreso visual */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`${chart.color === 'bg-green-500' ? 'bg-green-500' : 'bg-gray-500'} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${chart.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
