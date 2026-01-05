'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Filter, 
  RefreshCw,
  MessageSquare,
  Bot,
  Calendar,
  ChevronDown
} from 'lucide-react'

// IDs de usuarios a filtrar/excluir de las estadísticas
const EXCLUDED_USER_IDS = [
  "9f3344cc-c9e2-41ac-9fec-579d2d5f9c6c",
  "8b7ee356-42a4-41c5-be93-5fecd861037f",
  "8ea2524e-9e62-46e0-9857-40005d73ccf3"
]

interface UserSession {
  id: string
  user_id: string
  session_start: string
  session_end: string | null
  duration_minutes: number | null
}

interface UserInfo {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  business_name: string | null
}

interface SessionDataPoint {
  date: string
  dateFormatted: string
  sessions: number
  totalMinutes: number
  avgMinutes: number
}

interface AssistantStats {
  totalInteractions: number
  interactionsPercentage: number
  usersWithTwoPlus: number
  filteredInteractionsPercentage: number
  filteredCount: number
  configuredAssistants: number
  configuredPercentage: number
}

export function EstadisticasModule() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [showExcluded, setShowExcluded] = useState(false)
  const [assistantStats, setAssistantStats] = useState<AssistantStats>({
    totalInteractions: 0,
    interactionsPercentage: 0,
    usersWithTwoPlus: 0,
    filteredInteractionsPercentage: 0,
    filteredCount: 0,
    configuredAssistants: 0,
    configuredPercentage: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
        setLoadingChart(true)
        setLoadingUsers(true)
      } else {
        setLoading(true)
        setLoadingChart(true)
        setLoadingUsers(true)
      }

      // Fetch users first (para los filtros)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, business_name, account_type')

      if (usersError) {
        console.error('Error fetching users:', usersError)
      }

      setUsers(usersData || [])
      setLoadingUsers(false)

      // Fetch sessions (para la gráfica)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .order('session_start', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
      }

      setSessions(sessionsData || [])
      setLoadingChart(false)

      // Fetch assistant stats
      await fetchAssistantStats(usersData || [])

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingChart(false)
      setLoadingUsers(false)
    }
  }

  const fetchAssistantStats = async (allUsers: UserInfo[]) => {
    try {
      const totalUsers = allUsers.length

      if (totalUsers === 0) {
        setAssistantStats({
          totalInteractions: 0,
          interactionsPercentage: 0,
          usersWithTwoPlus: 0,
          filteredInteractionsPercentage: 0,
          filteredCount: 0,
          configuredAssistants: 0,
          configuredPercentage: 0
        })
        return
      }

      // Fetch messages and conversations
      const { data: messages } = await supabase
        .from('messages')
        .select('conversation_id')

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, user_id')

      let activeConversationUsers = 0
      if (messages && conversations) {
        const conversationToUser = new Map<string, string>()
        conversations.forEach(conv => {
          if (conv.id && conv.user_id) {
            conversationToUser.set(conv.id, conv.user_id)
          }
        })

        const userMessageCount = new Map<string, number>()
        messages.forEach(msg => {
          if (msg.conversation_id) {
            const userId = conversationToUser.get(msg.conversation_id)
            if (userId) {
              const count = userMessageCount.get(userId) || 0
              userMessageCount.set(userId, count + 1)
            }
          }
        })

        activeConversationUsers = Array.from(userMessageCount.entries())
          .filter(([_, count]) => count >= 2).length
      }

      // Fetch assistant configs
      const { data: assistantConfigs } = await supabase
        .from('assistant_configs')
        .select('user_id')
        .eq('is_configured', true)

      const assistantConfigUsers = assistantConfigs?.length || 0

      const usersWithAssistant = new Set<string>()
      if (assistantConfigs) {
        assistantConfigs.forEach(config => {
          if (config.user_id) {
            usersWithAssistant.add(config.user_id)
          }
        })
      }

      let activeConversationUsersWithAssistant = 0
      if (messages && conversations && usersWithAssistant.size > 0) {
        const conversationToUser = new Map<string, string>()
        conversations.forEach(conv => {
          if (conv.id && conv.user_id) {
            conversationToUser.set(conv.id, conv.user_id)
          }
        })

        const userMessageCount = new Map<string, number>()
        messages.forEach(msg => {
          if (msg.conversation_id) {
            const userId = conversationToUser.get(msg.conversation_id)
            if (userId && usersWithAssistant.has(userId)) {
              const count = userMessageCount.get(userId) || 0
              userMessageCount.set(userId, count + 1)
            }
          }
        })

        activeConversationUsersWithAssistant = Array.from(userMessageCount.entries())
          .filter(([_, count]) => count >= 2).length
      }

      setAssistantStats({
        totalInteractions: activeConversationUsers,
        interactionsPercentage: Math.round((activeConversationUsers / totalUsers) * 100),
        usersWithTwoPlus: activeConversationUsers,
        filteredInteractionsPercentage: usersWithAssistant.size > 0
          ? Math.round((activeConversationUsersWithAssistant / usersWithAssistant.size) * 100)
          : 0,
        filteredCount: activeConversationUsersWithAssistant,
        configuredAssistants: assistantConfigUsers,
        configuredPercentage: Math.round((assistantConfigUsers / totalUsers) * 100)
      })

    } catch (error) {
      console.error('Error fetching assistant stats:', error)
    }
  }

  // Filter sessions based on selections
  const filteredSessions = useMemo(() => {
    let result = sessions

    // Filter by excluded users
    if (!showExcluded) {
      result = result.filter(s => !EXCLUDED_USER_IDS.includes(s.user_id))
    }

    // Filter by selected user
    if (selectedUserId !== 'all') {
      result = result.filter(s => s.user_id === selectedUserId)
    }

    // Filter by date range
    const now = new Date()
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      result = result.filter(s => new Date(s.session_start) >= cutoff)
    }

    return result
  }, [sessions, selectedUserId, dateRange, showExcluded])

  // Group sessions by date for chart
  const chartData = useMemo(() => {
    const grouped = new Map<string, { sessions: number; totalMinutes: number }>()

    filteredSessions.forEach(session => {
      const date = new Date(session.session_start).toISOString().split('T')[0]
      const existing = grouped.get(date) || { sessions: 0, totalMinutes: 0 }
      existing.sessions += 1
      existing.totalMinutes += session.duration_minutes || 0
      grouped.set(date, existing)
    })

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        dateFormatted: new Date(date).toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short' 
        }),
        sessions: data.sessions,
        totalMinutes: Math.round(data.totalMinutes),
        avgMinutes: data.sessions > 0 ? Math.round(data.totalMinutes / data.sessions) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredSessions])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSessions = filteredSessions.length
    const totalMinutes = filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
    const uniqueUsers = new Set(filteredSessions.map(s => s.user_id)).size

    return { totalSessions, totalMinutes, avgSessionMinutes, uniqueUsers }
  }, [filteredSessions])

  // Get max value for chart scaling
  const maxMinutes = useMemo(() => {
    return Math.max(...chartData.map(d => d.totalMinutes), 1)
  }, [chartData])

  // Calculate Y-axis labels with proper spacing (avoid duplicates)
  const yAxisLabels = useMemo(() => {
    const max = maxMinutes
    if (max <= 0) {
      return ['0m']
    }
    
    // Crear un Set para evitar duplicados
    const labels = new Set<string>()
    labels.add(`${max}m`) // Siempre incluir el máximo
    labels.add('0m') // Siempre incluir 0
    
    // Para valores pequeños, mostrar valores más específicos
    if (max <= 5) {
      // Si el máximo es 1-5, mostrar: max, max/2 redondeado (si es diferente), 0
      if (max > 1) {
        const mid = Math.round(max / 2)
        if (mid > 0 && mid < max) {
          labels.add(`${mid}m`)
        }
      }
    } else if (max <= 30) {
      // Para valores medianos, usar división en 3
      const step = Math.ceil(max / 3)
      if (step * 2 < max) labels.add(`${step * 2}m`)
      if (step < max) labels.add(`${step}m`)
    } else {
      // Para valores grandes, usar división estándar
      const step = Math.ceil(max / 4)
      if (step * 3 < max) labels.add(`${step * 3}m`)
      if (step * 2 < max) labels.add(`${step * 2}m`)
      if (step < max) labels.add(`${step}m`)
    }
    
    // Convertir a array, parsear valores numéricos, ordenar de mayor a menor, y formatear
    return Array.from(labels)
      .map(label => ({
        label,
        value: parseInt(label.replace('m', '')) || 0
      }))
      .sort((a, b) => b.value - a.value)
      .map(item => item.label)
  }, [maxMinutes])

  // Filter users for dropdown (exclude filtered IDs by default)
  const selectableUsers = useMemo(() => {
    if (showExcluded) return users
    return users.filter(u => !EXCLUDED_USER_IDS.includes(u.id))
  }, [users, showExcluded])

  // Componente skeleton para la gráfica
  const ChartSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-56 animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {/* Legend skeleton */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        {/* Chart bars skeleton */}
        <div className="flex items-end gap-2 h-64 pt-4">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex-1 flex gap-0.5 items-end">
              <div 
                className="flex-1 bg-blue-100 rounded-t animate-pulse"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              ></div>
              <div 
                className="flex-1 bg-emerald-100 rounded-t animate-pulse"
                style={{ height: `${Math.random() * 40 + 10}%`, animationDelay: '150ms' }}
              ></div>
            </div>
          ))}
        </div>
        {/* X-axis labels skeleton */}
        <div className="flex gap-2 pt-2 ml-14">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Componente skeleton para filtros
  const FiltersSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-16 mb-1 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )

  // Componente skeleton para tarjetas de estadísticas
  const StatCardsSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { from: 'from-blue-50', to: 'to-blue-100', border: 'border-blue-200' },
        { from: 'from-emerald-50', to: 'to-emerald-100', border: 'border-emerald-200' },
        { from: 'from-violet-50', to: 'to-violet-100', border: 'border-violet-200' },
        { from: 'from-amber-50', to: 'to-amber-100', border: 'border-amber-200' }
      ].map((colors, i) => (
        <div key={i} className={`bg-gradient-to-br ${colors.from} ${colors.to} rounded-xl p-4 border ${colors.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-white/50 rounded animate-pulse"></div>
            <div className="h-4 bg-white/50 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-9 bg-white/50 rounded w-20 animate-pulse"></div>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-100 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <FiltersSkeleton />
        <StatCardsSkeleton />
        <ChartSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 text-sm sm:text-base">Análisis de sesiones y uso de la plataforma</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <span className="font-medium text-gray-700">Filtros</span>
          {loadingUsers && (
            <div className="ml-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User filter */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">Usuario</label>
            {loadingUsers ? (
              <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : (
              <>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="all">Todos los usuarios ({selectableUsers.length})</option>
                  {selectableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name || user.email} {user.last_name || ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
              </>
            )}
          </div>

          {/* Date range */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">Periodo</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
          </div>

          {/* Show excluded toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExcluded}
                onChange={(e) => setShowExcluded(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Mostrar usuarios excluidos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Sesiones Totales</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{summaryStats.totalSessions}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Tiempo Total</span>
          </div>
          <p className="text-3xl font-bold text-emerald-900">
            {summaryStats.totalMinutes >= 60 
              ? `${Math.floor(summaryStats.totalMinutes / 60)}h ${summaryStats.totalMinutes % 60}m`
              : `${summaryStats.totalMinutes}m`
            }
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-violet-600" />
            <span className="text-sm font-medium text-violet-700">Promedio/Sesión</span>
          </div>
          <p className="text-3xl font-bold text-violet-900">{summaryStats.avgSessionMinutes}m</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Usuarios Únicos</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">{summaryStats.uniqueUsers}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Sesiones y Tiempo por Día</h2>
          {loadingChart && (
            <div className="ml-2 flex items-center gap-1">
              <RefreshCw size={14} className="text-blue-500 animate-spin" />
              <span className="text-xs text-blue-500">Cargando datos...</span>
            </div>
          )}
        </div>

        {loadingChart ? (
          <div className="space-y-4">
            {/* Legend skeleton */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            {/* Chart bars skeleton con animación más visual */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
                <div className="h-3 bg-gray-100 rounded w-8 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-8 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-8 animate-pulse"></div>
              </div>
              <div className="ml-14 flex items-end gap-2 h-64 pb-8">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="flex gap-0.5 items-end flex-1">
                    <div 
                      className="flex-1 bg-gradient-to-t from-blue-200 to-blue-100 rounded-t animate-pulse"
                      style={{ 
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${i * 50}ms`
                      }}
                    ></div>
                    <div 
                      className="flex-1 bg-gradient-to-t from-emerald-200 to-emerald-100 rounded-t animate-pulse"
                      style={{ 
                        height: `${Math.random() * 40 + 10}%`,
                        animationDelay: `${i * 50 + 100}ms`
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Calendar size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">Sin datos de sesiones</p>
            <p className="text-sm">No hay sesiones registradas para el periodo seleccionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Tiempo total (minutos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Número de sesiones</span>
              </div>
            </div>

            {/* Custom Chart */}
            <div className="relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                {yAxisLabels.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>

              {/* Chart area */}
              <div className="ml-14 overflow-x-auto">
                <div className="flex items-end gap-1 min-w-max h-64 pb-8">
                  {chartData.map((day, index) => (
                    <div key={day.date} className="flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          <p className="font-medium">{day.dateFormatted}</p>
                          <p>Sesiones: {day.sessions}</p>
                          <p>Tiempo: {day.totalMinutes}m</p>
                          <p>Promedio: {day.avgMinutes}m</p>
                        </div>
                      </div>

                      {/* Bars container */}
                      <div className="flex gap-0.5 items-end h-56">
                        {/* Time bar */}
                        <div
                          className="w-4 sm:w-6 bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                          style={{ 
                            height: `${(day.totalMinutes / maxMinutes) * 100}%`, 
                            minHeight: day.totalMinutes > 0 ? '4px' : '0',
                            animationDelay: `${index * 30}ms`
                          }}
                        ></div>
                        {/* Sessions bar (scaled differently) */}
                        <div
                          className="w-4 sm:w-6 bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600"
                          style={{ 
                            height: `${(day.sessions / Math.max(...chartData.map(d => d.sessions), 1)) * 100}%`, 
                            minHeight: day.sessions > 0 ? '4px' : '0',
                            animationDelay: `${index * 30 + 50}ms`
                          }}
                        ></div>
                      </div>

                      {/* X-axis label */}
                      <span className="text-xs text-gray-500 mt-2 -rotate-45 origin-top-left whitespace-nowrap">
                        {day.dateFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assistant Stats Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bot size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Estadísticas del Asistente</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Interacciones Totales */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Interacciones Totales con Asistente</h3>
              <div className="p-2 rounded-lg bg-blue-100">
                <MessageSquare size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{assistantStats.interactionsPercentage}%</span>
              <span className="text-sm text-gray-500">({assistantStats.usersWithTwoPlus} usuarios)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Usuarios con 2+ mensajes al asistente</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${assistantStats.interactionsPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Interacciones Filtradas */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Interacciones con asistente, filtrado</h3>
              <div className="p-2 rounded-lg bg-indigo-100">
                <MessageSquare size={18} className="text-indigo-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{assistantStats.filteredCount}</span>
              <span className="text-sm text-gray-500">({assistantStats.filteredInteractionsPercentage}%)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Del 100% de users con asistente, cuántos mandaron 2+ mensajes</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${assistantStats.filteredInteractionsPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Asistentes Configurados */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Asistentes Configurados</h3>
              <div className="p-2 rounded-lg bg-emerald-100">
                <Bot size={18} className="text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{assistantStats.configuredPercentage}%</span>
              <span className="text-sm text-gray-500">({assistantStats.configuredAssistants} usuarios)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Usuarios con super asistente configurado</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${assistantStats.configuredPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sesiones Recientes</h2>
        
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay sesiones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Inicio</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Fin</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Duración</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.slice(0, 10).map((session) => {
                  const user = users.find(u => u.id === session.user_id)
                  return (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900 font-medium text-sm">
                            {user?.first_name || user?.email || 'Usuario desconocido'}
                          </p>
                          {user?.business_name && (
                            <p className="text-gray-500 text-xs">{user.business_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(session.session_start).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {session.session_end 
                          ? new Date(session.session_end).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : <span className="text-green-600 font-medium">Activa</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          session.duration_minutes 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {session.duration_minutes 
                            ? `${session.duration_minutes} min`
                            : 'En curso'
                          }
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

