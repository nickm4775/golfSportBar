export type NotificationVariant = 'success' | 'danger' | 'info'

export interface AppNotification {
  id: string
  title: string
  description?: string
  variant: NotificationVariant
  createdAt: string
  read: boolean
}
