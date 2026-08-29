import { toast } from '@heroui/react'
import type { NotificationVariant } from '@/domain/notifications/AppNotification'
import { useNotificationsStore } from '@/presentation/stores/notificationsStore'

export function notify(input: {
  title: string
  description?: string
  variant?: NotificationVariant
}) {
  const variant = input.variant ?? 'success'
  const options = input.description ? { description: input.description } : undefined

  if (variant === 'success') toast.success(input.title, options)
  else if (variant === 'danger') toast.danger(input.title, options)
  else toast.info(input.title, options)

  useNotificationsStore.getState().push({
    title: input.title,
    description: input.description,
    variant,
  })
}

export function notifyError(title: string, error: unknown, description?: string) {
  notify({
    title,
    description: description ?? (error instanceof Error ? error.message : undefined),
    variant: 'danger',
  })
}
