'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  UserX, 
  GraduationCap,
  AppWindow,
  Menu,
  X,
  Mail,
  Send,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Estadísticas generales'
    },
    {
      id: 'mentores',
      label: 'Mentores',
      icon: GraduationCap,
      description: 'Gestión de mentores'
    },
    {
      id: 'comunicaciones',
      label: 'Comunicaciones',
      icon: Send,
      description: 'Emails y notificaciones'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: BarChart3,
      description: 'Sesiones y análisis'
    },
    {
      id: 'apps-docs',
      label: 'Apps y docs',
      icon: AppWindow,
      description: 'Mini-apps y plantillas'
    }
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Hablemos Emprendimiento</h1>
            <p className="text-sm text-gray-600">Panel de Control</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon size={20} className="mr-3" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
