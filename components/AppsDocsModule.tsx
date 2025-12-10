'use client'

import { useEffect, useState } from 'react'
import { supabaseApps } from '@/lib/supabase-apps'
import { 
  AppWindow, 
  FileText,
  Github,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Mail,
  Search,
  RefreshCw,
  Eye,
  Tag,
  Layers,
  Star,
  ChevronRight,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface MiniApp {
  id: string
  created_at: string
  user_email: string
  github_url: string
  name: string
  short_description: string
  long_description: string
  features: string[]
  benefits: string[]
  requirements: string[]
  category: string
  tags: string[]
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado'
  status: 'pending' | 'approved' | 'rejected'
}

export function AppsDocsModule() {
  const [miniApps, setMiniApps] = useState<MiniApp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedApp, setSelectedApp] = useState<MiniApp | null>(null)
  const [showAppDetails, setShowAppDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'mini-apps' | 'plantillas'>('mini-apps')
  // Estado de loading por app: { [appId]: 'approving' | 'rejecting' | 'deleting' }
  const [updatingApps, setUpdatingApps] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalApps: 0,
    pendingApps: 0,
    approvedApps: 0,
    rejectedApps: 0
  })

  // Limpiar mensajes después de 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Categorías disponibles
  const CATEGORIES = [
    "Finanzas",
    "Marketing",
    "Ventas",
    "Productividad",
    "Análisis",
    "Automatización",
    "Recursos Humanos",
    "Legal",
    "Operaciones",
    "Otros"
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!supabaseApps) {
      console.error('Cliente de Supabase Apps no configurado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const { data: appsData, error: appsError } = await supabaseApps
        .from('mini_apps')
        .select('*')
        .order('created_at', { ascending: false })

      if (appsError) {
        console.error('Error fetching mini apps:', appsError)
        return
      }

      // Parsear los campos JSON si vienen como strings
      const processedApps = appsData?.map(app => ({
        ...app,
        features: typeof app.features === 'string' ? JSON.parse(app.features) : app.features || [],
        benefits: typeof app.benefits === 'string' ? JSON.parse(app.benefits) : app.benefits || [],
        requirements: typeof app.requirements === 'string' ? JSON.parse(app.requirements) : app.requirements || [],
        tags: typeof app.tags === 'string' ? JSON.parse(app.tags) : app.tags || []
      })) || []

      setMiniApps(processedApps)

      // Calcular estadísticas
      const totalApps = processedApps.length
      const pendingApps = processedApps.filter(a => a.status === 'pending').length
      const approvedApps = processedApps.filter(a => a.status === 'approved').length
      const rejectedApps = processedApps.filter(a => a.status === 'rejected').length

      setStats({
        totalApps,
        pendingApps,
        approvedApps,
        rejectedApps
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppStatus = async (appId: string, newStatus: 'approved' | 'rejected') => {
    if (!supabaseApps) {
      setErrorMessage('Cliente de Supabase no configurado')
      return
    }

    const actionLabel = newStatus === 'approved' ? 'approving' : 'rejecting'
    const statusLabel = newStatus === 'approved' ? 'aprobada' : 'rechazada'

    try {
      // Marcar esta app como actualizándose
      setUpdatingApps(prev => ({ ...prev, [appId]: actionLabel }))
      setErrorMessage(null)

      console.log(`Actualizando app ${appId} a estado: ${newStatus}`)

      // Realizar la actualización
      const { data, error } = await supabaseApps
        .from('mini_apps')
        .update({ status: newStatus })
        .eq('id', appId)
        .select()

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error al actualizar: ${error.message}`)
      }

      console.log('Respuesta de actualización:', data)

      // Verificar que la actualización se realizó
      if (!data || data.length === 0) {
        // Intentar verificar el estado actual
        const { data: verifyData, error: verifyError } = await supabaseApps
          .from('mini_apps')
          .select('status')
          .eq('id', appId)
          .single()

        if (verifyError) {
          throw new Error(`No se pudo verificar la actualización: ${verifyError.message}`)
        }

        if (verifyData?.status !== newStatus) {
          throw new Error('La actualización no se guardó correctamente. Verifica los permisos de la base de datos.')
        }
      }

      // Actualizar estado local
      setMiniApps(prevApps => 
        prevApps.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        )
      )

      // Recalcular estadísticas usando el callback para tener el estado más reciente
      setMiniApps(prevApps => {
        const updatedApps = prevApps.map(app => 
          app.id === appId ? { ...app, status: newStatus } : app
        )
        
        setStats({
          totalApps: updatedApps.length,
          pendingApps: updatedApps.filter(a => a.status === 'pending').length,
          approvedApps: updatedApps.filter(a => a.status === 'approved').length,
          rejectedApps: updatedApps.filter(a => a.status === 'rejected').length
        })

        return updatedApps
      })

      // Actualizar modal si está abierto
      if (showAppDetails && selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null)
      }

      // Mostrar mensaje de éxito
      const appName = miniApps.find(a => a.id === appId)?.name || 'App'
      setSuccessMessage(`✓ "${appName}" ha sido ${statusLabel} exitosamente`)

    } catch (error) {
      console.error('Error updating status:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al actualizar')
    } finally {
      // Quitar el estado de loading de esta app
      setUpdatingApps(prev => {
        const newState = { ...prev }
        delete newState[appId]
        return newState
      })
    }
  }

  const deleteApp = async (appId: string) => {
    if (!supabaseApps) {
      setErrorMessage('Cliente de Supabase no configurado')
      return
    }
    
    const appName = miniApps.find(a => a.id === appId)?.name || 'App'
    
    if (!confirm(`¿Estás seguro de eliminar "${appName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setUpdatingApps(prev => ({ ...prev, [appId]: 'deleting' }))
      setErrorMessage(null)

      const { error } = await supabaseApps
        .from('mini_apps')
        .delete()
        .eq('id', appId)

      if (error) {
        throw new Error(`Error al eliminar: ${error.message}`)
      }

      // Actualizar estado local
      setMiniApps(prevApps => {
        const filtered = prevApps.filter(app => app.id !== appId)
        
        // Recalcular estadísticas
        setStats({
          totalApps: filtered.length,
          pendingApps: filtered.filter(a => a.status === 'pending').length,
          approvedApps: filtered.filter(a => a.status === 'approved').length,
          rejectedApps: filtered.filter(a => a.status === 'rejected').length
        })

        return filtered
      })
      
      // Cerrar modal si está abierto
      if (showAppDetails && selectedApp?.id === appId) {
        setShowAppDetails(false)
        setSelectedApp(null)
      }

      setSuccessMessage(`✓ "${appName}" ha sido eliminada`)

    } catch (error) {
      console.error('Error deleting app:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al eliminar')
    } finally {
      setUpdatingApps(prev => {
        const newState = { ...prev }
        delete newState[appId]
        return newState
      })
    }
  }

  const filteredApps = miniApps.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'approved':
        return 'Aprobada'
      case 'rejected':
        return 'Rechazada'
      default:
        return status
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico':
        return 'bg-green-100 text-green-800'
      case 'Intermedio':
        return 'bg-yellow-100 text-yellow-800'
      case 'Avanzado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico':
        return '🟢'
      case 'Intermedio':
        return '🟡'
      case 'Avanzado':
        return '🔴'
      default:
        return '⚪'
    }
  }

  // Verificar si el cliente está configurado
  if (!supabaseApps) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Apps y Documentos</h1>
            <p className="text-gray-600">Gestiona las mini-apps y plantillas subidas por la comunidad</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Configuración requerida</h3>
              <p className="text-yellow-700 mb-4">
                Para usar este módulo, necesitas configurar las variables de entorno para la base de datos de Apps.
              </p>
              <div className="bg-yellow-100 rounded p-4 font-mono text-sm text-yellow-800">
                <p className="mb-1"># Agregar en .env.local:</p>
                <p>NEXT_PUBLIC_SUPABASE_APPS_URL=tu_url_de_apps_database</p>
                <p>NEXT_PUBLIC_SUPABASE_APPS_ANON_KEY=tu_anon_key_de_apps_database</p>
              </div>
              <p className="text-yellow-700 mt-4 text-sm">
                Estas credenciales son las mismas que usas en <code className="bg-yellow-100 px-1 rounded">impulsa-ai-app</code> para la base de datos de mini-apps.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensajes de éxito/error */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800 font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Apps y Documentos</h1>
          <p className="text-gray-600">Gestiona las mini-apps y plantillas subidas por la comunidad</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mini-Apps</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApps}</p>
            </div>
            <AppWindow className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingApps}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedApps}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedApps}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('mini-apps')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'mini-apps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AppWindow size={18} />
              Mini-Apps ({filteredApps.length})
            </button>
            <button
              onClick={() => setActiveTab('plantillas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'plantillas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText size={18} />
              Plantillas de Docs
            </button>
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="p-6">
          {activeTab === 'mini-apps' ? (
            <>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, email, descripción o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="rejected">Rechazadas</option>
                </select>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Lista de Mini-Apps */}
              <div className="space-y-4">
                {filteredApps.map((app) => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(app.difficulty)}`}>
                            {getDifficultyEmoji(app.difficulty)} {app.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">{app.short_description}</p>
                        
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{app.user_email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            <span>{app.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(app.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {app.tags.slice(0, 4).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {app.tags.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{app.tags.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedApp(app)
                              setShowAppDetails(true)
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <a
                            href={app.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver en GitHub"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        </div>
                        
                        {/* Acciones rápidas */}
                        {app.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateAppStatus(app.id, 'approved')}
                              disabled={!!updatingApps[app.id]}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1 min-w-[70px] justify-center"
                            >
                              {updatingApps[app.id] === 'approving' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Aprobar'
                              )}
                            </button>
                            <button
                              onClick={() => updateAppStatus(app.id, 'rejected')}
                              disabled={!!updatingApps[app.id]}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 min-w-[70px] justify-center"
                            >
                              {updatingApps[app.id] === 'rejecting' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Rechazar'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredApps.length === 0 && (
                  <div className="text-center py-12">
                    <AppWindow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron mini-apps</h3>
                    <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Tab de Plantillas
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Plantillas de Documentos</h3>
              <p className="text-gray-600 mb-4">Esta sección estará disponible próximamente</p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <Clock className="h-4 w-4 mr-2" />
                En desarrollo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {showAppDetails && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApp.name}</h2>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedApp.status)}`}>
                    {getStatusLabel(selectedApp.status)}
                  </span>
                </div>
                <button
                  onClick={() => setShowAppDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Email del usuario</p>
                    <p className="font-medium">{selectedApp.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de envío</p>
                    <p className="font-medium">{formatDate(selectedApp.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Categoría</p>
                    <p className="font-medium">{selectedApp.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dificultad</p>
                    <p className="font-medium">{getDifficultyEmoji(selectedApp.difficulty)} {selectedApp.difficulty}</p>
                  </div>
                </div>

                {/* GitHub URL */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    Repositorio
                  </h4>
                  <a
                    href={selectedApp.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {selectedApp.github_url}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Descripciones */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descripción Corta</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedApp.short_description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descripción Detallada</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedApp.long_description}</p>
                </div>

                {/* Características */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500" />
                    Características
                  </h4>
                  <ul className="space-y-2">
                    {selectedApp.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <ChevronRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Beneficios */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Beneficios
                  </h4>
                  <ul className="space-y-2">
                    {selectedApp.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requisitos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Requisitos
                  </h4>
                  <ul className="space-y-2">
                    {selectedApp.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Etiquetas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {selectedApp.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updateAppStatus(selectedApp.id, 'approved')}
                        disabled={!!updatingApps[selectedApp.id]}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updatingApps[selectedApp.id] === 'approving' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Aprobando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Aprobar Mini-App
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => updateAppStatus(selectedApp.id, 'rejected')}
                        disabled={!!updatingApps[selectedApp.id]}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updatingApps[selectedApp.id] === 'rejecting' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Rechazando...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => updateAppStatus(selectedApp.id, selectedApp.status === 'approved' ? 'rejected' : 'approved')}
                        disabled={!!updatingApps[selectedApp.id]}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                          selectedApp.status === 'approved' 
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {updatingApps[selectedApp.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : selectedApp.status === 'approved' ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            Cambiar a Rechazada
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Cambiar a Aprobada
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteApp(selectedApp.id)}
                        disabled={!!updatingApps[selectedApp.id]}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updatingApps[selectedApp.id] === 'deleting' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Eliminar
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
