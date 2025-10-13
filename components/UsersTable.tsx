'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit, Trash2, UserCheck, UserX, AlertCircle } from 'lucide-react'
import { ConfirmationModal } from './ConfirmationModal'

interface User {
  id: string
  email: string
  account_type: 'free' | 'pro'
  created_at: string
  updated_at: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newAccountType, setNewAccountType] = useState<'free' | 'pro' | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pro' | 'free'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  // Limpiar mensajes de error/éxito después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        setError(`Error al cargar usuarios: ${error.message}`)
        return
      }

      setUsers(data || [])
      // Limpiar filtro si no hay usuarios del tipo filtrado
      if (filter !== 'all' && data) {
        const hasFilteredUsers = data.some(user => user.account_type === filter)
        if (!hasFilteredUsers) {
          setFilter('all')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión al cargar usuarios')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAccountTypeChange = (user: User, newType: 'free' | 'pro') => {
    setSelectedUser(user)
    setNewAccountType(newType)
    setShowModal(true)
    setError(null)
    setSuccess(null)
  }

  const confirmAccountTypeChange = async () => {
    if (!selectedUser || !newAccountType) return

    try {
      setIsUpdating(true)
      setError(null)

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('users')
        .update({ 
          account_type: newAccountType, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedUser.id)

      if (error) {
        throw new Error(`Error al actualizar usuario: ${error.message}`)
      }

      // Actualizar la lista local
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, account_type: newAccountType, updated_at: new Date().toISOString() }
          : user
      ))

      setSuccess(`Usuario ${selectedUser.email} cambiado a ${newAccountType === 'pro' ? 'PRO' : 'GRATUITO'} exitosamente`)
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        setShowModal(false)
        setSelectedUser(null)
        setNewAccountType(null)
        setSuccess(null)
      }, 1500)

    } catch (error) {
      console.error('Error updating user:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al actualizar usuario')
    } finally {
      setIsUpdating(false)
    }
  }

  const closeModal = () => {
    if (!isUpdating) {
      setShowModal(false)
      setSelectedUser(null)
      setNewAccountType(null)
      setError(null)
      setSuccess(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filtrar usuarios según el filtro seleccionado
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    return user.account_type === filter
  })

  // Contar usuarios por tipo
  const totalUsers = users.length
  const proUsers = users.filter(user => user.account_type === 'pro').length
  const freeUsers = users.filter(user => user.account_type === 'free').length

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Usuarios Recientes</h2>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {filteredUsers.length} de {totalUsers} usuarios
            {filter !== 'all' && ` (${filter === 'pro' ? 'PRO' : 'Gratuitos'})`}
          </p>
        </div>
        <button 
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Actualizando...
            </>
          ) : (
            'Actualizar'
          )}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Todos ({totalUsers})
        </button>
        <button
          onClick={() => setFilter('pro')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'pro'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          PRO ({proUsers})
        </button>
        <button
          onClick={() => setFilter('free')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'free'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Gratuitos ({freeUsers})
        </button>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <p className="text-gray-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-3">
          <UserCheck className="h-4 w-4 text-gray-600" />
          <p className="text-gray-700 text-sm">{success}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo de Cuenta</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha de Registro</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    user.account_type === 'pro' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    {user.account_type === 'pro' ? 'PRO' : 'GRATUITO'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-1">
                    {user.account_type === 'free' ? (
                      <button
                        onClick={() => handleAccountTypeChange(user, 'pro')}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                        title="Cambiar a PRO"
                      >
                        <UserCheck size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAccountTypeChange(user, 'free')}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                        title="Cambiar a Gratuito"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {users.length === 0 
            ? 'No hay usuarios registrados'
            : `No hay usuarios ${filter === 'pro' ? 'PRO' : filter === 'free' ? 'gratuitos' : ''}`
          }
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showModal}
        onClose={closeModal}
        onConfirm={confirmAccountTypeChange}
        title={`Cambiar tipo de cuenta`}
        message={`¿Estás seguro de que quieres cambiar el usuario ${selectedUser?.email} de ${selectedUser?.account_type === 'free' ? 'GRATUITO' : 'PRO'} a ${newAccountType === 'pro' ? 'PRO' : 'GRATUITO'}?`}
        confirmText={isUpdating ? 'Cambiando...' : `Cambiar a ${newAccountType === 'pro' ? 'PRO' : 'GRATUITO'}`}
        confirmColor={newAccountType === 'pro' ? 'green' : 'yellow'}
        isLoading={isUpdating}
      />
    </div>
  )
}
