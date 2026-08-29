import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify } from '@/presentation/lib/notify'
import {
  connectRealtime,
  disconnectRealtime,
  setRealtimeEventHandler,
  type BusinessRealtimeEvent,
} from '@/infrastructure/realtime/centrifugeClient'

const EVENT_KEY: Record<BusinessRealtimeEvent['type'], string> = {
  'order.changed': 'orderChanged',
  'gspro.changed': 'gsproChanged',
  'catalog.changed': 'catalogChanged',
}

export function RealtimeProvider() {
  const { t } = useTranslation('admin')
  const status = useAuthStore((state) => state.status)
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    setRealtimeEventHandler((event) => {
      if (event.actorUserId && event.actorUserId === userId) return
      const key = EVENT_KEY[event.type]
      notify({
        title: t(`realtime.${key}.title`),
        description: t(`realtime.${key}.description`),
        variant: 'info',
      })
    })
    return () => setRealtimeEventHandler(null)
  }, [t, userId])

  useEffect(() => {
    connectRealtime()
    return () => disconnectRealtime()
  }, [status, activeBusinessId])

  return null
}
