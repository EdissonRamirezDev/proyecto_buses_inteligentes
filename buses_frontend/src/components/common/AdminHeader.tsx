import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backRoute?: string
  onBack?: () => void
  action?: React.ReactNode
}

/**
 * Reusable header for Admin pages to provide consistent navigation and look.
 */
const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  subtitle, 
  showBack = true, 
  backRoute = '/dashboard',
  onBack,
  action 
}) => {
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack || (() => navigate(backRoute))}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 italic">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-3">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminHeader
