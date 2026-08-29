import type { ComponentType } from 'react'
import {
  Bell,
  BookOpen,
  Calendar,
  ChartColumn,
  CircleDollar,
  Display,
  Gear,
  MapPin,
  Person,
  Persons,
  ShoppingCart,
} from '@gravity-ui/icons'

export type AppNavItem = {
  to: string
  key: string
  permissions: string[]
  icon: ComponentType<{ className?: string }>
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    to: '/app/dashboard',
    key: 'nav.dashboard',
    permissions: ['orders:read', 'business:read'],
    icon: ChartColumn,
  },
  {
    to: '/app/business',
    key: 'nav.business',
    permissions: ['business:read'],
    icon: MapPin,
  },
  { to: '/app/orders', key: 'nav.orders', permissions: ['orders:read'], icon: ShoppingCart },
  { to: '/app/caja', key: 'nav.caja', permissions: ['orders:create'], icon: CircleDollar },
  {
    to: '/app/customers',
    key: 'nav.customers',
    permissions: ['customers:read', 'business:read'],
    icon: Person,
  },
  { to: '/app/catalog', key: 'nav.catalog', permissions: ['catalog:write'], icon: BookOpen },
  {
    to: '/app/reservations',
    key: 'nav.reservations',
    permissions: ['gspro:reservations:read'],
    icon: Calendar,
  },
  { to: '/app/sessions', key: 'nav.sessions', permissions: ['gspro:sessions:read'], icon: Display },
  { to: '/app/staff', key: 'nav.staff', permissions: ['members:read'], icon: Persons },
  {
    to: '/app/settings',
    key: 'nav.settings',
    permissions: ['business:write'],
    icon: Gear,
  },
  {
    to: '/app/notifications',
    key: 'nav.notifications',
    permissions: ['business:read'],
    icon: Bell,
  },
]

export const APP_ROUTE_PERMISSIONS: Record<string, string[]> = Object.fromEntries(
  APP_NAV_ITEMS.map((item) => [item.to.replace('/app/', ''), item.permissions]),
)

export function hasNavAccess(permissions: string[], userPermissions: string[]): boolean {
  if (permissions.length === 0) return true
  return permissions.every((permission) => userPermissions.includes(permission))
}

export function canAccessBusinessNav(userPermissions: string[], businessesCount: number): boolean {
  return userPermissions.includes('business:read') || businessesCount === 0
}

export function getFirstAllowedPath(
  userPermissions: string[],
  options?: { businessesCount?: number },
): string {
  for (const item of APP_NAV_ITEMS) {
    if (item.to === '/app/business') {
      if (canAccessBusinessNav(userPermissions, options?.businessesCount ?? 0)) {
        return item.to
      }
      continue
    }
    if (hasNavAccess(item.permissions, userPermissions)) {
      return item.to
    }
  }
  return '/app/orders'
}

export function filterNavItems(userPermissions: string[], businessesCount: number): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => {
    if (item.to === '/app/business') {
      return canAccessBusinessNav(userPermissions, businessesCount)
    }
    return hasNavAccess(item.permissions, userPermissions)
  })
}
