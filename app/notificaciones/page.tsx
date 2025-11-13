'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  AlertCircle,
  Calendar,
  MessageSquare,
  Megaphone,
  CheckCircle,
  X,
  Search
} from 'lucide-react'

interface UserOption {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

export default function NotificacionesPage() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Datos del formulario
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'general' | 'system' | 'announcement' | 'reminder' | 'alert'>('general')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [actionUrl, setActionUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .order('email')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim()) {
      setError('El título y el mensaje son obligatorios')
      return
    }

    if (recipientType === 'specific' && selectedUsers.length === 0) {
      setError('Debes seleccionar al menos un usuario')
      return
    }

    try {
      setSending(true)
      setError(null)

      const userIdsToNotify = recipientType === 'all' 
        ? users.map(u => u.id)
        : selectedUsers

      const notifications = userIdsToNotify.map(userId => ({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        action_url: actionUrl.trim() || null,
        expires_at: expiresAt || null,
        read: false,
        metadata: {}
      }))

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        throw new Error(`Error al enviar notificaciones: ${insertError.message}`)
      }

      setSuccess(true)
      
      // Limpiar formulario
      setTitle('')
      setMessage('')
      setType('general')
      setPriority('normal')
      setActionUrl('')
      setExpiresAt('')
      setSelectedUsers([])
      setRecipientType('all')

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000)

    } catch (error) {
      console.error('Error sending notifications:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setSending(false)
    }
  }

  const getTypeIcon = (notifType: string) => {
    switch (notifType) {
      case 'system': return <Bell className="h-4 w-4" />
      case 'announcement': return <Megaphone className="h-4 w-4" />
      case 'reminder': return <Calendar className="h-4 w-4" />
      case 'alert': return <AlertCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enviar Notificaciones</h1>
          <p className="text-gray-600">Envía notificaciones a usuarios específicos o a todos</p>
        </div>

        {/* Alertas */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">¡Notificaciones enviadas con éxito!</p>
              <p className="text-xs text-green-700 mt-1">
                {recipientType === 'all' 
                  ? `Se enviaron ${users.length} notificaciones` 
                  : `Se enviaron ${selectedUsers.length} notificaciones`}
              </p>
            </div>
            <button onClick={() => setSuccess(false)}>
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Notificación</h2>

              {/* Destinatarios */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Destinatarios
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecipientType('all')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      recipientType === 'all'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`h-6 w-6 mx-auto mb-2 ${
                      recipientType === 'all' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      recipientType === 'all' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Todos los usuarios
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{users.length} usuarios</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('specific')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      recipientType === 'specific'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className={`h-6 w-6 mx-auto mb-2 ${
                      recipientType === 'specific' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      recipientType === 'specific' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Usuarios específicos
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedUsers.length} seleccionados
                    </p>
                  </button>
                </div>
              </div>

              {/* Tipo y Prioridad */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de notificación
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la notificación"
                  maxLength={255}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/255 caracteres</p>
              </div>

              {/* Mensaje */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el mensaje de la notificación..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{message.length} caracteres</p>
              </div>

              {/* URL de acción */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de acción (opcional)
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/ruta/de/accion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  La URL a la que se dirigirá el usuario al hacer clic
                </p>
              </div>

              {/* Fecha de expiración */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de expiración (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  La notificación se eliminará automáticamente después de esta fecha
                </p>
              </div>

              {/* Botón de enviar */}
              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Notificación
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Selector de usuarios (solo visible si recipientType === 'specific') */}
          {recipientType === 'specific' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Seleccionar Usuarios
                </h3>

                {/* Búsqueda */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar usuarios..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Seleccionar todos */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full mb-3 py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedUsers.length === filteredUsers.length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </button>

                {/* Lista de usuarios */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No se encontraron usuarios
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.email}
                          </p>
                          {user.first_name && user.last_name && (
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{selectedUsers.length}</span> de{' '}
                    <span className="font-medium">{filteredUsers.length}</span> usuarios
                    seleccionados
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

