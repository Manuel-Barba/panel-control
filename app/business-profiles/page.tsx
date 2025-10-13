'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, User, Calendar, MapPin, ExternalLink, ArrowLeft, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  business_differentiator: string
  motivation: string
  experience: string
  countries: string[]
  language: string
  currency: string
  capital: number
  connections: number
  rfc: string
  legal_name: string
  commercial_name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  website: string
  logo_url: string
  created_at: string
  updated_at: string
  user_email?: string
  user_first_name?: string
  user_last_name?: string
}

export default function BusinessProfilesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<BusinessProfile[]>([])
  const [displayedProfiles, setDisplayedProfiles] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true)
  const [totalProfiles, setTotalProfiles] = useState(0)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    fetchAllBusinessProfiles()
  }, [])

  useEffect(() => {
    // Resetear página cuando cambie el término de búsqueda
    if (searchTerm !== '') {
      setCurrentPage(1)
    }
  }, [searchTerm])

  useEffect(() => {
    // Filtrar perfiles basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setDisplayedProfiles(profiles.slice(0, currentPage * ITEMS_PER_PAGE))
    } else {
      const filtered = profiles.filter(profile => 
        profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.commercial_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.user_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.user_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.country?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setDisplayedProfiles(filtered.slice(0, currentPage * ITEMS_PER_PAGE))
    }
    
    // Actualizar si hay más perfiles disponibles
    const totalFiltered = searchTerm.trim() === '' 
      ? profiles.length 
      : profiles.filter(profile => 
          profile.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.commercial_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.user_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.user_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.country?.toLowerCase().includes(searchTerm.toLowerCase())
        ).length
    
    setHasMoreProfiles(currentPage * ITEMS_PER_PAGE < totalFiltered)
  }, [searchTerm, profiles, currentPage])

  const fetchAllBusinessProfiles = async () => {
    try {
      setLoading(true)
      setLoadingProgress(0)

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      // Obtener TODOS los business profiles con información del usuario
      const { data, error } = await supabase
        .from('business_profiles')
        .select(`
          *,
          users!inner(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      clearInterval(progressInterval)
      setLoadingProgress(100)

      if (error) {
        console.error('Error fetching business profiles:', error)
        return
      }

      if (data) {
        const profilesWithUserInfo = data.map(profile => ({
          ...profile,
          user_email: profile.users?.email,
          user_first_name: profile.users?.first_name,
          user_last_name: profile.users?.last_name
        }))
        setProfiles(profilesWithUserInfo)
        setTotalProfiles(profilesWithUserInfo.length)
        setCurrentPage(1) // Resetear a la primera página
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 500) // Pequeño delay para mostrar el 100%
    }
  }

  const loadMoreProfiles = () => {
    setLoadingMore(true)
    setTimeout(() => {
      setCurrentPage(prev => prev + 1)
      setLoadingMore(false)
    }, 500) // Simular carga
  }

  const toggleExpanded = (profileId: string) => {
    setExpandedProfile(expandedProfile === profileId ? null : profileId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header con botón de regreso */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Business Profiles</h1>
          </div>

          {/* Loading robusto */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="relative mb-6">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando Business Profiles</h2>
              <p className="text-gray-600 mb-6">Obteniendo todos los perfiles de negocio de la base de datos...</p>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                {Math.round(loadingProgress)}% completado
              </p>
            </div>
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Profiles</h1>
              <p className="text-gray-600">
                Mostrando {displayedProfiles.length} de {totalProfiles} perfiles
                {searchTerm && ` (filtrados por "${searchTerm}")`}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de negocio, usuario, ciudad, país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none outline-none text-gray-900 placeholder-gray-500"
            />
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Lista de perfiles */}
        {displayedProfiles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay business profiles registrados'}
            </h2>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los perfiles aparecerán aquí cuando se registren'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profile.business_name || profile.commercial_name || 'Sin nombre'}
                      </h3>
                      {profile.website && (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>
                          {profile.user_first_name && profile.user_last_name 
                            ? `${profile.user_first_name} ${profile.user_last_name}`
                            : profile.user_email
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(profile.created_at)}</span>
                      </div>
                      {profile.city && profile.country && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.city}, {profile.country}</span>
                        </div>
                      )}
                    </div>

                    {profile.business_differentiator && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {profile.business_differentiator}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpanded(profile.id)}
                    className="ml-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {expandedProfile === profile.id ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>
                </div>

                {expandedProfile === profile.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Información del Negocio */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Información del Negocio</h4>
                        <div className="space-y-2 text-sm">
                          {profile.motivation && (
                            <p><span className="text-gray-500 font-medium">Motivación:</span> {profile.motivation}</p>
                          )}
                          {profile.experience && (
                            <p><span className="text-gray-500 font-medium">Experiencia:</span> {profile.experience}</p>
                          )}
                          {profile.language && (
                            <p><span className="text-gray-500 font-medium">Idioma:</span> {profile.language}</p>
                          )}
                          {profile.currency && (
                            <p><span className="text-gray-500 font-medium">Moneda:</span> {profile.currency}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Recursos */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Recursos</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500 font-medium">Capital:</span> {profile.capital}/100</p>
                          <p><span className="text-gray-500 font-medium">Conexiones:</span> {profile.connections}/100</p>
                          {profile.countries && profile.countries.length > 0 && (
                            <p><span className="text-gray-500 font-medium">Países:</span> {profile.countries.join(', ')}</p>
                          )}
                        </div>
                      </div>

                      {/* Información Fiscal */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Información Fiscal</h4>
                        <div className="space-y-2 text-sm">
                          {profile.rfc && (
                            <p><span className="text-gray-500 font-medium">RFC:</span> {profile.rfc}</p>
                          )}
                          {profile.legal_name && (
                            <p><span className="text-gray-500 font-medium">Razón Social:</span> {profile.legal_name}</p>
                          )}
                          {profile.address && (
                            <p><span className="text-gray-500 font-medium">Dirección:</span> {profile.address}</p>
                          )}
                          {profile.zip_code && (
                            <p><span className="text-gray-500 font-medium">CP:</span> {profile.zip_code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Botón Cargar más */}
            {hasMoreProfiles && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={loadMoreProfiles}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <span>Cargar más ({ITEMS_PER_PAGE} más)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
