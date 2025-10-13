'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Bot, CreditCard, TrendingUp } from 'lucide-react'

interface AnalyticsData {
  businessPlanPercentage: number
  assistantConfigPercentage: number
  paidUsersPercentage: number
  freeUsersPercentage: number
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData>({
    businessPlanPercentage: 0,
    assistantConfigPercentage: 0,
    paidUsersPercentage: 0,
    freeUsersPercentage: 0
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

      const totalUsers = users?.length || 0

      if (totalUsers === 0) {
        setData({
          businessPlanPercentage: 0,
          assistantConfigPercentage: 0,
          paidUsersPercentage: 0,
          freeUsersPercentage: 0
        })
        return
      }

      // 1. Porcentaje de usuarios que creó business plan
      const { data: businessPlans, error: bpError } = await supabase
        .from('business_plans')
        .select('user_id')

      let businessPlanUsers = 0
      if (!bpError && businessPlans) {
        const uniqueUsers = new Set(businessPlans.map(bp => bp.user_id))
        businessPlanUsers = uniqueUsers.size
      }

      // 2. Porcentaje de usuarios que configuró asistente
      const { data: assistantConfigs, error: acError } = await supabase
        .from('assistant_configs')
        .select('user_id')
        .eq('is_configured', true)

      const assistantConfigUsers = assistantConfigs?.length || 0

      // 3. Porcentaje de usuarios de paga vs gratuitos
      const paidUsers = users?.filter(user => user.account_type === 'pro').length || 0
      const freeUsers = users?.filter(user => user.account_type === 'free').length || 0

      setData({
        businessPlanPercentage: Math.round((businessPlanUsers / totalUsers) * 100),
        assistantConfigPercentage: Math.round((assistantConfigUsers / totalUsers) * 100),
        paidUsersPercentage: Math.round((paidUsers / totalUsers) * 100),
        freeUsersPercentage: Math.round((freeUsers / totalUsers) * 100)
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartCards = [
    {
      title: 'Business Plans Creados',
      percentage: data.businessPlanPercentage,
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Usuarios con business plan'
    },
    {
      title: 'Asistentes Configurados',
      percentage: data.assistantConfigPercentage,
      icon: Bot,
      color: 'bg-green-500',
      description: 'Usuarios con super asistente'
    },
    {
      title: 'Usuarios de Paga',
      percentage: data.paidUsersPercentage,
      icon: CreditCard,
      color: 'bg-purple-500',
      description: 'Suscripciones PRO activas'
    }
  ]

  if (loading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
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
              <span className="text-2xl font-bold text-gray-900">{chart.percentage}%</span>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </div>
            
            <p className="text-xs text-gray-500 mt-1">{chart.description}</p>
            
            {/* Barra de progreso visual */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gray-700 h-1.5 rounded-full transition-all duration-500"
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
