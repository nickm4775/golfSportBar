import { lazy, Suspense } from 'react'
import { SiteHeader } from '@/presentation/components/layout/SiteHeader'
import { SiteFooter } from '@/presentation/components/layout/SiteFooter'
import { HomeDocumentSeo } from '@/presentation/components/seo/DocumentSeo'
import { LocalBusinessJsonLd } from '@/presentation/components/seo/LocalBusinessJsonLd'
import { HeroSection } from '@/presentation/sections/Hero/HeroSection'
import { SimulatorScrollSection } from '@/presentation/sections/SimulatorScroll/SimulatorScrollSection'
import { MenuScrollSection } from '@/presentation/sections/MenuScroll/MenuScrollSection'

const StoresMapSection = lazy(() =>
  import('@/presentation/sections/StoresMap/StoresMapSection').then((module) => ({
    default: module.StoresMapSection,
  })),
)

export function HomePage() {
  return (
    <>
      <HomeDocumentSeo />
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main>
        <HeroSection />
        <SimulatorScrollSection />
        <MenuScrollSection />
        <Suspense
          fallback={
            <section id="stores" className="flex min-h-[50vh] items-center justify-center py-24">
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--gsb-accent-soft)] opacity-40" />
            </section>
          }
        >
          <StoresMapSection />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
