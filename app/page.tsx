'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { DashboardStats } from '@/components/DashboardStats'
import { UsersTable } from '@/components/UsersTable'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { BusinessProfilesList } from '@/components/BusinessProfilesList'
import { GraduationCap, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Monitorea el estado de Hablemos Emprendimiento</p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
              >
                <RefreshCw size={14} />
                Actualizar Todo
              </button>
            </div>
            
            <DashboardStats key={`stats-${refreshKey}`} />
            
            {/* Nueva fila con 4 contenedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyticsCharts key={`analytics-${refreshKey}`} />
              <BusinessProfilesList key={`profiles-${refreshKey}`} />
            </div>
            
            <UsersTable key={`users-${refreshKey}`} />
          </div>
        )
      
      case 'mentores':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentores</h1>
              <p className="text-gray-600">Gestión de mentores y solicitudes</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Módulo de Mentores</h2>
              <p className="text-gray-600 mb-4">
                Esta funcionalidad estará disponible próximamente
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <span className="text-sm font-medium">En desarrollo</span>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="ml-0 lg:ml-64">
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
