import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/presentation/pages/HomePage'
import { LoginPage } from '@/presentation/pages/LoginPage'
import { ProtectedApp } from '@/presentation/components/layout/AppShell'
import {
  AppHomeRedirect,
  RequirePermissions,
} from '@/presentation/components/layout/RequirePermissions'
import { DashboardPage } from '@/presentation/pages/app/DashboardPage'
import { OrdersPage } from '@/presentation/pages/app/OrdersPage'
import { CatalogPage } from '@/presentation/pages/app/CatalogPage'
import { ReservationsPage } from '@/presentation/pages/app/ReservationsPage'
import { SessionsPage } from '@/presentation/pages/app/SessionsPage'
import { BusinessPage } from '@/presentation/pages/app/BusinessPage'
import { StaffPage } from '@/presentation/pages/app/StaffPage'
import { NotificationsPage } from '@/presentation/pages/app/NotificationsPage'
import { CajaPage } from '@/presentation/pages/app/CajaPage'
import { CustomersPage } from '@/presentation/pages/app/CustomersPage'
import { SettingsPage } from '@/presentation/pages/app/SettingsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<ProtectedApp />}>
          <Route index element={<AppHomeRedirect />} />
          <Route
            path="dashboard"
            element={
              <RequirePermissions permissions={['orders:read', 'business:read']}>
                <DashboardPage />
              </RequirePermissions>
            }
          />
          <Route
            path="orders"
            element={
              <RequirePermissions permissions={['orders:read']}>
                <OrdersPage />
              </RequirePermissions>
            }
          />
          <Route
            path="caja"
            element={
              <RequirePermissions permissions={['orders:create']}>
                <CajaPage />
              </RequirePermissions>
            }
          />
          <Route
            path="customers"
            element={
              <RequirePermissions permissions={['customers:read', 'business:read']}>
                <CustomersPage />
              </RequirePermissions>
            }
          />
          <Route
            path="catalog"
            element={
              <RequirePermissions permissions={['catalog:write']}>
                <CatalogPage />
              </RequirePermissions>
            }
          />
          <Route path="warehouse" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="bays" element={<Navigate to="/app/business" replace />} />
          <Route
            path="reservations"
            element={
              <RequirePermissions permissions={['gspro:reservations:read']}>
                <ReservationsPage />
              </RequirePermissions>
            }
          />
          <Route
            path="sessions"
            element={
              <RequirePermissions permissions={['gspro:sessions:read']}>
                <SessionsPage />
              </RequirePermissions>
            }
          />
          <Route
            path="business"
            element={
              <RequirePermissions permissions={['business:read']} allowWhenNoBusiness>
                <BusinessPage />
              </RequirePermissions>
            }
          />
          <Route
            path="staff"
            element={
              <RequirePermissions permissions={['members:read']}>
                <StaffPage />
              </RequirePermissions>
            }
          />
          <Route
            path="settings"
            element={
              <RequirePermissions permissions={['business:write']}>
                <SettingsPage />
              </RequirePermissions>
            }
          />
          <Route
            path="notifications"
            element={
              <RequirePermissions permissions={['business:read']}>
                <NotificationsPage />
              </RequirePermissions>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
