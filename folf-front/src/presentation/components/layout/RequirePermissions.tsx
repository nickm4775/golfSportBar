import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getFirstAllowedPath } from '@/presentation/lib/appNav'

export function RequirePermissions({
  permissions,
  children,
  allowWhenNoBusiness = false,
}: {
  permissions: string[]
  children: ReactNode
  allowWhenNoBusiness?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const userPermissions = user?.permissions ?? []
  const businessesCount = user?.businesses.length ?? 0

  const allowed =
    (allowWhenNoBusiness && businessesCount === 0) ||
    (permissions.length === 0
      ? true
      : permissions.every((permission) => hasPermission(permission)))

  if (!allowed) {
    return <Navigate to={getFirstAllowedPath(userPermissions, { businessesCount })} replace />
  }

  return children
}

export function AppHomeRedirect() {
  const user = useAuthStore((state) => state.user)
  const userPermissions = user?.permissions ?? []
  const businessesCount = user?.businesses.length ?? 0
  const target = getFirstAllowedPath(userPermissions, { businessesCount })
  const relative = target.replace('/app/', '')

  return <Navigate to={relative || 'orders'} replace />
}
