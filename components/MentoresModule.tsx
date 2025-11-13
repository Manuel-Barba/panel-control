'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react'

interface Mentor {
  id: string
  email: string
  name: string
  verified: boolean
  title: string | null
  company: string | null
  experience_years: number | null
  specialties: string[]
  location: string | null
  availability: 'Disponible' | 'Ocupado' | 'No disponible'
  languages: string[]
  bio: string | null
  avatar_url: string | null
  linkedin_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
  meeting_requests_count?: number
  pending_requests_count?: number
}

interface MeetingRequest {
  id: string
  mentor_id: string
  from_team: string
  contact_name: string
  topic: string
  date: string
  time: string
  status: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Completada'
  created_at: string
  meeting_link: string | null
  mentor_name?: string
}

export function MentoresModule() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Disponible' | 'Ocupado' | 'No disponible'>('all')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [showMentorDetails, setShowMentorDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'mentors' | 'requests'>('mentors')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [mentorToDelete, setMentorToDelete] = useState<Mentor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalMentors: 0,
    verifiedMentors: 0,
    availableMentors: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener mentores con conteo de solicitudes
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('mentores')
        .select(`
          *,
          mentor_meeting_requests(count)
        `)
        .order('created_at', { ascending: false })

      if (mentorsError) {
        console.error('Error fetching mentors:', mentorsError)
        return
      }

      // Obtener solicitudes de reuniones con información del mentor
      const { data: requestsData, error: requestsError } = await supabase
        .from('mentor_meeting_requests')
        .select(`
          *,
          mentores(name)
        `)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error fetching meeting requests:', requestsError)
        return
      }

      // Procesar datos de mentores
      const processedMentors = mentorsData?.map(mentor => {
        const totalRequests = mentor.mentor_meeting_requests?.[0]?.count || 0
        const pendingRequests = requestsData?.filter(req => 
          req.mentor_id === mentor.id && req.status === 'Pendiente'
        ).length || 0

        return {
          ...mentor,
          meeting_requests_count: totalRequests,
          pending_requests_count: pendingRequests
        }
      }) || []

      // Procesar datos de solicitudes
      const processedRequests = requestsData?.map(request => ({
        ...request,
        mentor_name: request.mentores?.name || 'Mentor no encontrado'
      })) || []

      setMentors(processedMentors)
      setMeetingRequests(processedRequests)

      // Calcular estadísticas
      const totalMentors = processedMentors.length
      const verifiedMentors = processedMentors.filter(m => m.verified).length
      const availableMentors = processedMentors.filter(m => m.availability === 'Disponible').length
      const totalRequests = processedRequests.length
      const pendingRequests = processedRequests.filter(r => r.status === 'Pendiente').length
      const completedRequests = processedRequests.filter(r => r.status === 'Completada').length

      setStats({
        totalMentors,
        verifiedMentors,
        availableMentors,
        totalRequests,
        pendingRequests,
        completedRequests
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = 
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesAvailability = availabilityFilter === 'all' || mentor.availability === availabilityFilter
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && mentor.verified) ||
      (verificationFilter === 'unverified' && !mentor.verified)
    
    return matchesSearch && matchesAvailability && matchesVerification
  })

  const filteredRequests = meetingRequests.filter(request => {
    return (request.mentor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.from_team.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Aprobada':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Rechazada':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Completada':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Disponible':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Ocupado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'No disponible':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleDeleteMentor = (mentor: Mentor) => {
    setMentorToDelete(mentor)
    setShowDeleteModal(true)
  }

  const confirmDeleteMentor = async () => {
    if (!mentorToDelete) return

    try {
      setIsDeleting(true)

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('mentores')
        .delete()
        .eq('id', mentorToDelete.id)

      if (error) {
        throw new Error(`Error al eliminar mentor: ${error.message}`)
      }

      // Actualizar la lista local
      setMentors(mentors.filter(mentor => mentor.id !== mentorToDelete.id))

      // Cerrar modal
      setShowDeleteModal(false)
      setMentorToDelete(null)

    } catch (error) {
      console.error('Error deleting mentor:', error)
      alert(error instanceof Error ? error.message : 'Error desconocido al eliminar mentor')
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setMentorToDelete(null)
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Mentores</h1>
          <p className="text-gray-600">Administra mentores y solicitudes de reuniones</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mentores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMentors}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verificados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verifiedMentors}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableMentors}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reuniones pendientes por aprobar o rechazar por el mentor</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedRequests}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('mentors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mentors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mentores ({filteredMentors.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Solicitudes de Reuniones ({filteredRequests.length})
            </button>
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="p-6">
          {activeTab === 'mentors' ? (
            <>
              {/* Filtros para mentores */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar mentores por nombre, email, empresa o especialidad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas las disponibilidades</option>
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="No disponible">No disponible</option>
                </select>
                
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="verified">Verificados</option>
                  <option value="unverified">No verificados</option>
                </select>
              </div>

              {/* Lista de mentores */}
              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <div key={mentor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {mentor.avatar_url ? (
                            <img
                              src={mentor.avatar_url}
                              alt={mentor.name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <GraduationCap className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                            {mentor.verified && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{mentor.email}</span>
                            </div>
                            {mentor.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{mentor.phone}</span>
                              </div>
                            )}
                            {mentor.company && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Empresa:</span>
                                <span>{mentor.company}</span>
                              </div>
                            )}
                            {mentor.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{mentor.location}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getAvailabilityColor(mentor.availability)}`}>
                              {mentor.availability}
                            </span>
                            {mentor.experience_years && (
                              <span className="text-sm text-gray-600">
                                {mentor.experience_years} años de experiencia
                              </span>
                            )}
                          </div>
                          
                          {mentor.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {mentor.specialties.slice(0, 3).map((specialty, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {specialty}
                                </span>
                              ))}
                              {mentor.specialties.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{mentor.specialties.length - 3} más
                                </span>
                              )}
                            </div>
                          )}
                          
                          {mentor.bio && (
                            <p className="text-sm text-gray-600 line-clamp-2">{mentor.bio}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-600">
                          <div className="font-medium">{mentor.meeting_requests_count || 0} solicitudes</div>
                          <div className="text-orange-600">{mentor.pending_requests_count || 0} pendientes</div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedMentor(mentor)
                              setShowMentorDetails(true)
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {mentor.linkedin_url && (
                            <a
                              href={mentor.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver LinkedIn"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteMentor(mentor)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar mentor"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredMentors.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron mentores</h3>
                    <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Filtros para solicitudes */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar solicitudes por mentor, contacto o tema..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lista de solicitudes */}
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.topic}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Mentor:</span> {request.mentor_name}</p>
                            <p><span className="font-medium">Contacto:</span> {request.contact_name}</p>
                            <p><span className="font-medium">Equipo:</span> {request.from_team}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Fecha:</span> {formatDate(request.date)}</p>
                            <p><span className="font-medium">Hora:</span> {request.time}</p>
                            <p><span className="font-medium">Creada:</span> {formatDate(request.created_at)}</p>
                          </div>
                        </div>
                        
                        {request.meeting_link && (
                          <div className="mt-3">
                            <a
                              href={request.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Enlace de la reunión</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron solicitudes</h3>
                    <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de detalles del mentor */}
      {showMentorDetails && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Mentor</h2>
                <button
                  onClick={() => setShowMentorDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  {selectedMentor.avatar_url ? (
                    <img
                      src={selectedMentor.avatar_url}
                      alt={selectedMentor.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <GraduationCap className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{selectedMentor.name}</h3>
                      {selectedMentor.verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Email:</span> {selectedMentor.email}</p>
                      {selectedMentor.phone && (
                        <p><span className="font-medium">Teléfono:</span> {selectedMentor.phone}</p>
                      )}
                      {selectedMentor.title && (
                        <p><span className="font-medium">Título:</span> {selectedMentor.title}</p>
                      )}
                      {selectedMentor.company && (
                        <p><span className="font-medium">Empresa:</span> {selectedMentor.company}</p>
                      )}
                      {selectedMentor.experience_years && (
                        <p><span className="font-medium">Experiencia:</span> {selectedMentor.experience_years} años</p>
                      )}
                      {selectedMentor.location && (
                        <p><span className="font-medium">Ubicación:</span> {selectedMentor.location}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Idiomas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor.languages.map((language, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedMentor.bio && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Biografía</h4>
                    <p className="text-gray-600">{selectedMentor.bio}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedMentor.meeting_requests_count || 0}</div>
                    <div className="text-sm text-gray-600">Total Solicitudes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{selectedMentor.pending_requests_count || 0}</div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar mentor */}
      {showDeleteModal && mentorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Mentor</h3>
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
              ¿Estás seguro de que quieres eliminar permanentemente al mentor <strong>{mentorToDelete.name}</strong>? 
              Esta acción no se puede deshacer y también se eliminarán todas las solicitudes de reuniones asociadas.
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
                onClick={confirmDeleteMentor}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isDeleting ? 'Eliminando...' : 'Eliminar Mentor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
