'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, 
  Bell, 
  Send, 
  Users, 
  User,
  Crown,
  GraduationCap,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Zap,
  Eye,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Calendar,
  MessageSquare
} from 'lucide-react'

// Tipos
interface UserData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  account_type: 'free' | 'pro'
  is_active: boolean
  email_verified: boolean
  created_at: string
}

interface MentorData {
  id: string
  email: string
  name: string
  verified: boolean
  availability?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  description: string
}

type TabType = 'notifications' | 'config'
type RecipientFilter = 'all' | 'free' | 'pro' | 'mentors' | 'non-mentors' | 'specific'

// Templates de email predefinidos
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Bienvenida',
    subject: '¡Bienvenido a Hablemos Emprendimiento!',
    description: 'Email de bienvenida para nuevos usuarios',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">¡Bienvenido a Hablemos Emprendimiento!</h1>
        <p style="color: #666; font-size: 16px;">Estamos emocionados de tenerte con nosotros.</p>
        <p style="color: #666; font-size: 16px;">Tu viaje emprendedor comienza ahora. Explora nuestra plataforma y conecta con mentores que pueden ayudarte a crecer.</p>
        <a href="https://hablemosemprendimiento.com" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Explorar la Plataforma</a>
      </div>
    `
  },
  {
    id: '2',
    name: 'Upgrade a Pro',
    subject: '🚀 Desbloquea todo el potencial con Pro',
    description: 'Promoción para upgrade a cuenta Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">🚀 Lleva tu emprendimiento al siguiente nivel</h1>
        <p style="color: #666; font-size: 16px;">Con una cuenta Pro tendrás acceso a:</p>
        <ul style="color: #666; font-size: 16px;">
          <li>Sesiones ilimitadas con mentores</li>
          <li>Herramientas exclusivas</li>
          <li>Contenido premium</li>
          <li>Soporte prioritario</li>
        </ul>
        <a href="https://hablemosemprendimiento.com/pro" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Actualizar a Pro</a>
      </div>
    `
  },
  {
    id: '3',
    name: 'Nueva Funcionalidad',
    subject: '✨ Nueva funcionalidad disponible',
    description: 'Anuncio de nueva característica',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">✨ ¡Novedad en la plataforma!</h1>
        <p style="color: #666; font-size: 16px;">Hemos lanzado una nueva funcionalidad que te va a encantar.</p>
        <p style="color: #666; font-size: 16px;">[Describe la nueva funcionalidad aquí]</p>
        <a href="https://hablemosemprendimiento.com" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Probar ahora</a>
      </div>
    `
  },
  {
    id: '4',
    name: 'Recordatorio de Evento',
    subject: '📅 No te pierdas nuestro próximo evento',
    description: 'Invitación/recordatorio de evento',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">📅 Evento próximamente</h1>
        <p style="color: #666; font-size: 16px;">Te invitamos a participar en nuestro próximo evento:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1a1a1a; margin: 0 0 10px 0;">[Nombre del evento]</h2>
          <p style="color: #666; margin: 5px 0;"><strong>Fecha:</strong> [Fecha]</p>
          <p style="color: #666; margin: 5px 0;"><strong>Hora:</strong> [Hora]</p>
        </div>
        <a href="[URL_EVENTO]" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Registrarme</a>
      </div>
    `
  }
]

export function ComunicacionesModule() {
  // Estados principales
  const [activeTab, setActiveTab] = useState<TabType>('notifications')
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Datos
  const [users, setUsers] = useState<UserData[]>([])
  const [mentors, setMentors] = useState<MentorData[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  
  // Control de llamadas simultáneas
  const [isFetching, setIsFetching] = useState(false)
  const [isCheckingConfig, setIsCheckingConfig] = useState(false)

  // Configuración de Resend
  const [resendConfig, setResendConfig] = useState<{
    configured: boolean
    fromEmail?: string
    apiKeyValid?: boolean
    error?: string
  } | null>(null)

  // Formulario de Email
  const [emailRecipientFilter, setEmailRecipientFilter] = useState<RecipientFilter>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([])
  const [customEmails, setCustomEmails] = useState('')  // Emails personalizados separados por coma o línea
  const [emailSubject, setEmailSubject] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [emailText, setEmailText] = useState('')
  const [useHtml, setUseHtml] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Formulario de Notificaciones
  const [notifRecipientFilter, setNotifRecipientFilter] = useState<RecipientFilter>('all')
  const [selectedNotifUserIds, setSelectedNotifUserIds] = useState<string[]>([])
  const [selectedNotifMentorIds, setSelectedNotifMentorIds] = useState<string[]>([])
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState<'general' | 'system' | 'announcement' | 'reminder' | 'alert'>('general')
  const [notifPriority, setNotifPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [notifActionUrl, setNotifActionUrl] = useState('')
  const [notifExpiresAt, setNotifExpiresAt] = useState('')
  const [includeMentorsInNotif, setIncludeMentorsInNotif] = useState(false)
  const [sendEmailWithNotif, setSendEmailWithNotif] = useState(false)

  // Búsqueda
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [mentorSearchTerm, setMentorSearchTerm] = useState('')

  // UI
  const [showUserSelector, setShowUserSelector] = useState(false)
  const [showMentorSelector, setShowMentorSelector] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Estadísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    verifiedEmails: 0,
    totalMentors: 0,
    verifiedMentors: 0,
    availableMentors: 0
  })

  // Cargar datos iniciales
  useEffect(() => {
    fetchData()
    checkResendConfig()
  }, [])

  // Función helper para retry con backoff exponencial
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido')
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error('Error después de múltiples intentos')
  }

  // Función helper para timeout
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 30000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('La petición excedió el tiempo límite')), timeoutMs)
      )
    ])
  }

  // Validar datos de usuario
  const validateUserData = (user: any): user is UserData => {
    return (
      user &&
      typeof user.id === 'string' &&
      typeof user.email === 'string' &&
      user.email.includes('@') &&
      (user.first_name === null || typeof user.first_name === 'string') &&
      (user.last_name === null || typeof user.last_name === 'string') &&
      (user.account_type === 'free' || user.account_type === 'pro') &&
      typeof user.is_active === 'boolean' &&
      typeof user.email_verified === 'boolean' &&
      typeof user.created_at === 'string'
    )
  }

  // Validar datos de mentor
  const validateMentorData = (mentor: any): mentor is MentorData => {
    return (
      mentor &&
      typeof mentor.id === 'string' &&
      typeof mentor.email === 'string' &&
      mentor.email.includes('@') &&
      typeof mentor.name === 'string' &&
      typeof mentor.verified === 'boolean' &&
      (mentor.availability === undefined || typeof mentor.availability === 'string')
    )
  }

  const fetchData = async () => {
    // Prevenir llamadas múltiples simultáneas
    if (isFetching) {
      console.warn('fetchData ya está en ejecución, ignorando llamada duplicada')
      return
    }

    try {
      setIsFetching(true)
      setLoading(true)
      setError(null)

      // Cargar usuarios y mentores en paralelo con retry y timeout
      const [usersResult, mentorsResult] = await Promise.allSettled([
        retryWithBackoff(async () => {
          setLoadingUsers(true)
          try {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, email, first_name, last_name, account_type, is_active, email_verified, created_at')
              .eq('is_active', true)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })

            if (usersError) {
              throw new Error(`Error de Supabase: ${usersError.message}`)
            }

            if (!usersData) {
              throw new Error('No se recibieron datos de usuarios')
            }

            // Validar y limpiar datos
            const validUsers: UserData[] = usersData
              .filter(validateUserData)
              .map((u) => ({
                ...u,
                account_type: u.account_type || 'free' as const,
                email: u.email.trim().toLowerCase(),
                first_name: u.first_name?.trim() || null,
                last_name: u.last_name?.trim() || null
              }))

            if (validUsers.length === 0 && usersData.length > 0) {
              console.warn('Algunos usuarios fueron filtrados por validación')
            }

            setUsers(validUsers)
            
            // Calcular estadísticas de usuarios
            const total = validUsers.length
            const pro = validUsers.filter((u) => u.account_type === 'pro').length
            const verified = validUsers.filter((u) => u.email_verified).length
            
            setStats(prev => ({
              ...prev,
              totalUsers: total,
              proUsers: pro,
              freeUsers: total - pro,
              verifiedEmails: verified
            }))

            return validUsers
          } finally {
            setLoadingUsers(false)
          }
        }, 3, 1000),
        
        retryWithBackoff(async () => {
          setLoadingMentors(true)
          try {
            const { data: mentorsData, error: mentorsError } = await supabase
              .from('mentores')
              .select('id, email, name, verified, availability')
              .order('name')

            if (mentorsError) {
              throw new Error(`Error de Supabase: ${mentorsError.message}`)
            }

            if (!mentorsData) {
              throw new Error('No se recibieron datos de mentores')
            }

            // Validar y limpiar datos
            const validMentors: MentorData[] = mentorsData
              .filter(validateMentorData)
              .map((m) => ({
                ...m,
                email: m.email.trim().toLowerCase(),
                name: m.name.trim()
              }))

            if (validMentors.length === 0 && mentorsData.length > 0) {
              console.warn('Algunos mentores fueron filtrados por validación')
            }

            setMentors(validMentors)
            
            // Calcular estadísticas de mentores
            const total = validMentors.length
            const verified = validMentors.filter((m) => m.verified).length
            const available = validMentors.filter((m) => m.availability === 'Disponible').length
            
            setStats(prev => ({
              ...prev,
              totalMentors: total,
              verifiedMentors: verified,
              availableMentors: available
            }))

            return validMentors
          } finally {
            setLoadingMentors(false)
          }
        }, 3, 1000)
      ])

      // Manejar resultados de usuarios
      if (usersResult.status === 'rejected') {
        const errorMessage = usersResult.reason instanceof Error 
          ? usersResult.reason.message 
          : 'Error desconocido al cargar usuarios'
        console.error('Error cargando usuarios después de reintentos:', errorMessage)
        setError(`Error cargando usuarios: ${errorMessage}`)
        // Mantener usuarios existentes si hay error
      }

      // Manejar resultados de mentores
      if (mentorsResult.status === 'rejected') {
        const errorMessage = mentorsResult.reason instanceof Error 
          ? mentorsResult.reason.message 
          : 'Error desconocido al cargar mentores'
        console.error('Error cargando mentores después de reintentos:', errorMessage)
        // Solo mostrar error si también fallaron los usuarios
        if (usersResult.status === 'rejected') {
          setError(`Error cargando datos: ${errorMessage}`)
        } else {
          // Mostrar advertencia pero no error crítico
          console.warn('No se pudieron cargar mentores, pero los usuarios se cargaron correctamente')
        }
        // Mantener mentores existentes si hay error
      }

      // Si ambos fallaron, mostrar mensaje más descriptivo
      if (usersResult.status === 'rejected' && mentorsResult.status === 'rejected') {
        setError('No se pudieron cargar usuarios ni mentores. Verifica tu conexión e intenta de nuevo.')
      }

    } catch (error) {
      console.error('Error inesperado en fetchData:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al cargar datos')
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }

  const checkResendConfig = async () => {
    // Prevenir llamadas múltiples simultáneas
    if (isCheckingConfig) {
      console.warn('checkResendConfig ya está en ejecución, ignorando llamada duplicada')
      return
    }

    try {
      setIsCheckingConfig(true)
      setLoadingConfig(true)

      const response = await withTimeout(
        fetch('/api/email/config'),
        10000 // 10 segundos para config
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Validar estructura de respuesta
      if (typeof data !== 'object' || data === null) {
        throw new Error('Respuesta inválida del servidor')
      }

      setResendConfig({
        configured: Boolean(data.configured),
        fromEmail: typeof data.fromEmail === 'string' ? data.fromEmail : undefined,
        apiKeyValid: typeof data.apiKeyValid === 'boolean' ? data.apiKeyValid : undefined,
        error: typeof data.error === 'string' ? data.error : undefined
      })

    } catch (error) {
      console.error('Error checking Resend config:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al verificar configuración'
      
      setResendConfig({ 
        configured: false, 
        error: `Error al verificar configuración: ${errorMessage}` 
      })
    } finally {
      setLoadingConfig(false)
      setIsCheckingConfig(false)
    }
  }

  // Filtrar usuarios según el filtro seleccionado
  const getFilteredUsers = (filter: RecipientFilter) => {
    switch (filter) {
      case 'free':
        return users.filter(u => u.account_type === 'free')
      case 'pro':
        return users.filter(u => u.account_type === 'pro')
      case 'specific':
        return users.filter(u => 
          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          (u.first_name && u.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
          (u.last_name && u.last_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
        )
      default:
        return users
    }
  }

  // Filtrar mentores
  const getFilteredMentors = () => {
    return mentors.filter(m =>
      m.name.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(mentorSearchTerm.toLowerCase())
    )
  }

  // Parsear emails personalizados (separados por coma, punto y coma, o salto de línea)
  const parseCustomEmails = (): string[] => {
    if (!customEmails.trim()) return []
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = customEmails
      .split(/[,;\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && emailRegex.test(e))
    
    // Eliminar duplicados
    return [...new Set(emails)]
  }

  // Obtener destinatarios de email según filtro
  const getEmailRecipients = () => {
    if (emailRecipientFilter === 'mentors') {
      return { users: [], mentors: mentors, customEmails: [] }
    }
    if (emailRecipientFilter === 'specific') {
      return {
        users: users.filter(u => selectedUserIds.includes(u.id)),
        mentors: mentors.filter(m => selectedMentorIds.includes(m.id)),
        customEmails: parseCustomEmails()
      }
    }
    return { users: getFilteredUsers(emailRecipientFilter), mentors: [], customEmails: [] }
  }

  // Obtener destinatarios de notificación según filtro
  const getNotifRecipients = () => {
    let targetUsers: UserData[] = []
    let targetMentors: MentorData[] = []

    if (notifRecipientFilter === 'mentors') {
      targetMentors = mentors
    } else if (notifRecipientFilter === 'specific') {
      targetUsers = users.filter(u => selectedNotifUserIds.includes(u.id))
      targetMentors = mentors.filter(m => selectedNotifMentorIds.includes(m.id))
    } else {
      targetUsers = getFilteredUsers(notifRecipientFilter)
      if (includeMentorsInNotif) {
        targetMentors = mentors
      }
    }

    return { users: targetUsers, mentors: targetMentors }
  }

  // Enviar email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailSubject.trim()) {
      setError('El asunto es obligatorio')
      return
    }

    if (useHtml && !emailHtml.trim()) {
      setError('El contenido HTML es obligatorio')
      return
    }

    if (!useHtml && !emailText.trim()) {
      setError('El contenido de texto es obligatorio')
      return
    }

    const recipients = getEmailRecipients()
    const allEmails = [
      ...recipients.users.map(u => u.email),
      ...recipients.mentors.map(m => m.email),
      ...recipients.customEmails
    ]

    // Eliminar duplicados
    const uniqueEmails = [...new Set(allEmails.map(e => e.toLowerCase()))]

    if (uniqueEmails.length === 0) {
      setError('No hay destinatarios seleccionados. Agrega al menos un email.')
      return
    }

    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: uniqueEmails,
          subject: emailSubject,
          html: useHtml ? emailHtml : undefined,
          text: !useHtml ? emailText : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      setSuccess(`✉️ Email enviado exitosamente a ${uniqueEmails.length} destinatario(s)`)
      
      // Limpiar formulario
      setEmailSubject('')
      setEmailHtml('')
      setEmailText('')
      setSelectedUserIds([])
      setSelectedMentorIds([])
      setCustomEmails('')
      setSelectedTemplate('')

      setTimeout(() => setSuccess(null), 5000)

    } catch (error) {
      console.error('Error sending email:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setSending(false)
    }
  }

  // Enviar notificaciones
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!notifTitle.trim() || !notifMessage.trim()) {
      setError('Título y mensaje son obligatorios')
      return
    }

    const recipients = getNotifRecipients()

    if (recipients.users.length === 0 && recipients.mentors.length === 0) {
      setError('No hay destinatarios seleccionados')
      return
    }

    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: recipients.users.map(u => u.id),
          mentorIds: recipients.mentors.map(m => m.id),
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          priority: notifPriority,
          actionUrl: notifActionUrl || undefined,
          expiresAt: notifExpiresAt || undefined,
          sendEmail: sendEmailWithNotif
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar notificaciones')
      }

      // Construir mensaje de éxito
      let successMessage = `🔔 Notificaciones enviadas: ${data.counts.users} usuarios, ${data.counts.mentors} mentores`
      if (sendEmailWithNotif && data.email) {
        if (data.email.error) {
          successMessage += `\n⚠️ Correos: ${data.email.error}`
        } else if (data.email.sent > 0) {
          successMessage += `\n✉️ Correos enviados: ${data.email.sent} de ${data.email.total}`
        }
      }
      
      setSuccess(successMessage)
      
      // Limpiar formulario
      setNotifTitle('')
      setNotifMessage('')
      setNotifType('general')
      setNotifPriority('normal')
      setNotifActionUrl('')
      setNotifExpiresAt('')
      setSelectedNotifUserIds([])
      setSelectedNotifMentorIds([])

      setTimeout(() => setSuccess(null), 5000)

    } catch (error) {
      console.error('Error sending notifications:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setSending(false)
    }
  }

  // Aplicar template
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setEmailSubject(template.subject)
      setEmailHtml(template.html)
      setSelectedTemplate(templateId)
    }
  }

  // Toggle user selection
  const toggleUserSelection = (userId: string, forNotif = false) => {
    if (forNotif) {
      setSelectedNotifUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      )
    } else {
      setSelectedUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      )
    }
  }

  // Toggle mentor selection
  const toggleMentorSelection = (mentorId: string, forNotif = false) => {
    if (forNotif) {
      setSelectedNotifMentorIds(prev =>
        prev.includes(mentorId) ? prev.filter(id => id !== mentorId) : [...prev, mentorId]
      )
    } else {
      setSelectedMentorIds(prev =>
        prev.includes(mentorId) ? prev.filter(id => id !== mentorId) : [...prev, mentorId]
      )
    }
  }

  // Renderizar tabs
  const tabs = [
    { id: 'notifications' as TabType, label: 'Notificaciones', icon: Bell, description: 'Notificaciones in-app' },
    { id: 'config' as TabType, label: 'Configuración', icon: Settings, description: 'Credenciales Resend' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-sm text-gray-600 space-y-1">
          {loadingUsers && <p>Cargando usuarios...</p>}
          {loadingMentors && <p>Cargando mentores...</p>}
          {loadingConfig && <p>Verificando configuración...</p>}
          {!loadingUsers && !loadingMentors && !loadingConfig && <p>Cargando datos...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Comunicaciones</h1>
          <p className="text-gray-600">Gestiona emails transaccionales y notificaciones</p>
        </div>
        <button
          onClick={() => { 
            fetchData()
            checkResendConfig()
          }}
          disabled={isFetching || isCheckingConfig}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isFetching || isCheckingConfig ? 'animate-spin' : ''} />
          {isFetching || isCheckingConfig ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Aviso informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              Aquí se gestionan los <strong>mails transaccionales</strong>. Para envíos de correo de ventas y marketing, se utiliza{' '}
              <a 
                href="https://www.beehiiv.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-700 font-medium underline hover:text-blue-800"
              >
                Beehiiv
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              {loadingUsers ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Cargando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              )}
            </div>
            <Users className={`h-8 w-8 text-blue-500 ${loadingUsers ? 'opacity-50' : ''}`} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Free</p>
              {loadingUsers ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Cargando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.freeUsers}</p>
              )}
            </div>
            <User className={`h-8 w-8 text-gray-500 ${loadingUsers ? 'opacity-50' : ''}`} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Pro</p>
              {loadingUsers ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Cargando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.proUsers}</p>
              )}
            </div>
            <Crown className={`h-8 w-8 text-yellow-500 ${loadingUsers ? 'opacity-50' : ''}`} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mentores</p>
              {loadingMentors ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Cargando...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalMentors}</p>
              )}
            </div>
            <GraduationCap className={`h-8 w-8 text-purple-500 ${loadingMentors ? 'opacity-50' : ''}`} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resend</p>
              {loadingConfig ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Verificando...</span>
                </div>
              ) : (
                <p className="text-sm font-bold">
                  {resendConfig?.configured ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle size={16} /> Activo
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle size={16} /> No configurado
                    </span>
                  )}
                </p>
              )}
            </div>
            <Zap className={`h-8 w-8 text-orange-500 ${loadingConfig ? 'opacity-50' : ''}`} />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-900 flex-1">{success}</p>
          <button onClick={() => setSuccess(null)}>
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-900 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Notificaciones */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <form onSubmit={handleSendNotification} className="space-y-6">
                {/* Selector de destinatarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Destinatarios
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { value: 'all', label: 'Todos', icon: Users, count: stats.totalUsers },
                      { value: 'free', label: 'Free', icon: User, count: stats.freeUsers },
                      { value: 'pro', label: 'Pro', icon: Crown, count: stats.proUsers },
                      { value: 'mentors', label: 'Solo Mentores', icon: GraduationCap, count: stats.totalMentors },
                      { value: 'specific', label: 'Específicos', icon: Filter, count: selectedNotifUserIds.length + selectedNotifMentorIds.length }
                    ].map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNotifRecipientFilter(option.value as RecipientFilter)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            notifRecipientFilter === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mx-auto mb-1 ${
                            notifRecipientFilter === option.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <p className={`text-xs font-medium ${
                            notifRecipientFilter === option.value ? 'text-blue-900' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500">{option.count}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Opción de incluir mentores */}
                  {notifRecipientFilter !== 'mentors' && notifRecipientFilter !== 'specific' && (
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMentorsInNotif}
                        onChange={(e) => setIncludeMentorsInNotif(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        También incluir mentores ({stats.totalMentors})
                      </span>
                    </label>
                  )}
                </div>

                {/* Selector específico de usuarios y mentores */}
                {notifRecipientFilter === 'specific' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Usuarios */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Usuarios ({selectedNotifUserIds.length})</h4>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Buscar usuarios..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredUsers('specific').slice(0, 50).map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedNotifUserIds.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id, true)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm truncate">{user.email}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Mentores */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Mentores ({selectedNotifMentorIds.length})</h4>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={mentorSearchTerm}
                          onChange={(e) => setMentorSearchTerm(e.target.value)}
                          placeholder="Buscar mentores..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredMentors().slice(0, 50).map((mentor) => (
                          <label
                            key={mentor.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedNotifMentorIds.includes(mentor.id)}
                              onChange={() => toggleMentorSelection(mentor.id, true)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm truncate">{mentor.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipo y Prioridad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de notificación
                    </label>
                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="general">General</option>
                      <option value="system">Sistema</option>
                      <option value="announcement">Anuncio</option>
                      <option value="reminder">Recordatorio</option>
                      <option value="alert">Alerta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={notifPriority}
                      onChange={(e) => setNotifPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Título de la notificación"
                    maxLength={255}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Mensaje de la notificación..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* URL de acción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de acción (opcional)
                  </label>
                  <input
                    type="text"
                    value={notifActionUrl}
                    onChange={(e) => setNotifActionUrl(e.target.value)}
                    placeholder="/ruta/destino"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Fecha expiración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de expiración (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={notifExpiresAt}
                    onChange={(e) => setNotifExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Checkbox para enviar por correo */}
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="sendEmailWithNotif"
                    checked={sendEmailWithNotif}
                    onChange={(e) => setSendEmailWithNotif(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="sendEmailWithNotif" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    También enviar aviso por correo
                  </label>
                </div>
                {sendEmailWithNotif && !resendConfig?.configured && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Resend no está configurado. Ve a la pestaña de Configuración para agregar tu API Key si deseas enviar por correo.
                    </p>
                  </div>
                )}

                {/* Resumen y botón enviar */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const recipients = getNotifRecipients()
                      return `${recipients.users.length} usuarios, ${recipients.mentors.length} mentores`
                    })()}
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Bell size={18} />
                        Enviar Notificación
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Configuración */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Configuración de Resend
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900">Estado de la API</p>
                      <p className="text-sm text-gray-500">
                        {resendConfig?.configured
                          ? 'Resend está configurado correctamente'
                          : 'Resend no está configurado'}
                      </p>
                    </div>
                    {resendConfig?.configured ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  {resendConfig?.fromEmail && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-900">Email remitente</p>
                        <p className="text-sm text-gray-500">{resendConfig.fromEmail}</p>
                      </div>
                      <Mail className="h-6 w-6 text-blue-500" />
                    </div>
                  )}

                  {resendConfig?.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{resendConfig.error}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Cómo configurar Resend</h4>
                  <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                    <li>Ve a <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a> y crea una cuenta</li>
                    <li>Obtén tu API Key desde el dashboard</li>
                    <li>Agrega las siguientes variables de entorno:</li>
                  </ol>
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                    <code className="text-sm text-green-400">
                      RESEND_API_KEY=re_xxxxxxxxxxxx<br />
                      RESEND_FROM_EMAIL=tu@dominio.com
                    </code>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Nota: Si usas el dominio de prueba de Resend (onboarding@resend.dev), solo podrás enviar emails a tu propia dirección verificada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
