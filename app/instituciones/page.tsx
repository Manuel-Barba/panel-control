'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Eye,
  Globe,
  User
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Institution {
  id: string
  name: string
  institution_type: string
  country: string
  city: string
  website_url: string | null
  logo_url: string | null
  contact_name: string
  contact_title: string
  email: string
  phone: string | null
  estimated_users: number | null
  description: string | null
  status: 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido'
  max_users: number
  active_users: number
  approved_at: string | null
  created_at: string
  updated_at: string
}

export default function InstitucionesPage() {
  const router = useRouter()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    totalUsuariosEstimados: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching institutions:', error)
        return
      }

      setInstitutions(data || [])

      // Calcular estadísticas
      const total = data?.length || 0
      const pendientes = data?.filter(i => i.status === 'pendiente').length || 0
      const aprobados = data?.filter(i => i.status === 'aprobado').length || 0
      const rechazados = data?.filter(i => i.status === 'rechazado').length || 0
      const totalUsuariosEstimados = data?.reduce((acc, i) => acc + (i.estimated_users || 0), 0) || 0

      setStats({
        total,
        pendientes,
        aprobados,
        rechazados,
        totalUsuariosEstimados
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateInstitutionStatus = async (id: string, newStatus: 'aprobado' | 'rechazado' | 'suspendido') => {
    try {
      setIsUpdatingStatus(true)
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'aprobado') {
        updateData.approved_at = new Date().toISOString()
        // Al aprobar, establecer max_users igual a estimated_users
        const institution = institutions.find(i => i.id === id)
        if (institution) {
          updateData.max_users = institution.estimated_users || 100
        }
      }

      const { error } = await supabase
        .from('instituciones')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw new Error(`Error al actualizar estado: ${error.message}`)
      }

      // Actualizar la lista local
      setInstitutions(institutions.map(i => 
        i.id === id ? { ...i, status: newStatus, ...updateData } : i
      ))

      // Cerrar modal de detalles si está abierto
      if (showDetails && selectedInstitution?.id === id) {
        setSelectedInstitution({ ...selectedInstitution, status: newStatus, ...updateData })
      }

      // Recalcular estadísticas
      fetchData()

    } catch (error) {
      console.error('Error updating status:', error)
      alert(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = 
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.country.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || institution.status === statusFilter
    const matchesType = typeFilter === 'all' || institution.institution_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Obtener tipos únicos para el filtro
  const uniqueTypes = [...new Set(institutions.map(i => i.institution_type))]

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
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'suspendido':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente'
      case 'aprobado':
        return 'Aprobado'
      case 'rechazado':
        return 'Rechazado'
      case 'suspendido':
        return 'Suspendido'
      default:
        return status
    }
  }

  const handleDeleteInstitution = (institution: Institution) => {
    setInstitutionToDelete(institution)
    setShowDeleteModal(true)
  }

  const confirmDeleteInstitution = async () => {
    if (!institutionToDelete) return

    try {
      setIsDeleting(true)

      const { error } = await supabase
        .from('instituciones')
        .delete()
        .eq('id', institutionToDelete.id)

      if (error) {
        throw new Error(`Error al eliminar institución: ${error.message}`)
      }

      setInstitutions(institutions.filter(i => i.id !== institutionToDelete.id))
      setShowDeleteModal(false)
      setInstitutionToDelete(null)
      fetchData()

    } catch (error) {
      console.error('Error deleting institution:', error)
      alert(error instanceof Error ? error.message : 'Error desconocido al eliminar')
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setInstitutionToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Instituciones</h1>
            <p className="text-gray-600">Administra las solicitudes de instituciones aliadas</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Instituciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.rechazados}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Estimados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsuariosEstimados.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, contacto, ciudad o país..."
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
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
              <option value="suspendido">Suspendidas</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de instituciones */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="space-y-4">
              {filteredInstitutions.map((institution) => (
                <div key={institution.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {institution.logo_url ? (
                          <img
                            src={institution.logo_url}
                            alt={institution.name}
                            className="h-16 w-16 rounded-lg object-contain bg-gray-50 p-1"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(institution.status)}`}>
                            {getStatusLabel(institution.status)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {institution.institution_type}
                          </span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{institution.city}, {institution.country}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{institution.estimated_users?.toLocaleString() || 0} usuarios estimados</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{institution.contact_name} - {institution.contact_title}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{institution.email}</span>
                          </div>
                          {institution.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{institution.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Registrada: {formatDate(institution.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {institution.status === 'pendiente' && (
                        <>
                          <button
                            onClick={() => updateInstitutionStatus(institution.id, 'aprobado')}
                            disabled={isUpdatingStatus}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => updateInstitutionStatus(institution.id, 'rechazado')}
                            disabled={isUpdatingStatus}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      
                      {institution.status === 'aprobado' && (
                        <button
                          onClick={() => updateInstitutionStatus(institution.id, 'suspendido')}
                          disabled={isUpdatingStatus}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}

                      {institution.status === 'suspendido' && (
                        <button
                          onClick={() => updateInstitutionStatus(institution.id, 'aprobado')}
                          disabled={isUpdatingStatus}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Reactivar
                        </button>
                      )}
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedInstitution(institution)
                            setShowDetails(true)
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {institution.website_url && (
                          <a
                            href={institution.website_url.startsWith('http') ? institution.website_url : `https://${institution.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver sitio web"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDeleteInstitution(institution)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar institución"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredInstitutions.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron instituciones</h3>
                  <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de detalles */}
        {showDetails && selectedInstitution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detalles de la Institución</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    {selectedInstitution.logo_url ? (
                      <img
                        src={selectedInstitution.logo_url}
                        alt={selectedInstitution.name}
                        className="h-20 w-20 rounded-lg object-contain bg-gray-50 p-2"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{selectedInstitution.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedInstitution.status)}`}>
                          {getStatusLabel(selectedInstitution.status)}
                        </span>
                      </div>
                      
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        {selectedInstitution.institution_type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ubicación</h4>
                      <p className="text-gray-600">{selectedInstitution.city}, {selectedInstitution.country}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Sitio Web</h4>
                      {selectedInstitution.website_url ? (
                        <a 
                          href={selectedInstitution.website_url.startsWith('http') ? selectedInstitution.website_url : `https://${selectedInstitution.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedInstitution.website_url}
                        </a>
                      ) : (
                        <p className="text-gray-400">No especificado</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Persona de Contacto</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">Nombre:</span> {selectedInstitution.contact_name}</p>
                      <p><span className="font-medium">Cargo:</span> {selectedInstitution.contact_title}</p>
                      <p><span className="font-medium">Email:</span> {selectedInstitution.email}</p>
                      {selectedInstitution.phone && (
                        <p><span className="font-medium">Teléfono:</span> {selectedInstitution.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Usuarios Estimados</h4>
                      <p className="text-2xl font-bold text-gray-900">{selectedInstitution.estimated_users?.toLocaleString() || 0}</p>
                    </div>
                    {selectedInstitution.status === 'aprobado' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Usuarios Máximos Asignados</h4>
                        <p className="text-2xl font-bold text-green-600">{selectedInstitution.max_users?.toLocaleString() || 0}</p>
                      </div>
                    )}
                  </div>

                  {selectedInstitution.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Descripción del Uso</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedInstitution.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                    <div>
                      <p><span className="font-medium">Registrada:</span> {formatDate(selectedInstitution.created_at)}</p>
                    </div>
                    {selectedInstitution.approved_at && (
                      <div>
                        <p><span className="font-medium">Aprobada:</span> {formatDate(selectedInstitution.approved_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    {selectedInstitution.status === 'pendiente' && (
                      <>
                        <button
                          onClick={() => {
                            updateInstitutionStatus(selectedInstitution.id, 'aprobado')
                          }}
                          disabled={isUpdatingStatus}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Aprobar Institución
                        </button>
                        <button
                          onClick={() => {
                            updateInstitutionStatus(selectedInstitution.id, 'rechazado')
                          }}
                          disabled={isUpdatingStatus}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {showDeleteModal && institutionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Institución</h3>
                </div>
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar permanentemente la institución <strong>{institutionToDelete.name}</strong>? 
                Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteInstitution}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
