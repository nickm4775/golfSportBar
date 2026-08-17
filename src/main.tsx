import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/AppProviders'
import { registerPwa } from '@/infrastructure/pwa/registerPwa'
import { HomePage } from '@/presentation/pages/HomePage'
import './index.css'

registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <HomePage />
    </AppProviders>
  </StrictMode>,
)
