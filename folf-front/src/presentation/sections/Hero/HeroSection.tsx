import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function HeroSection() {
  const { t } = useTranslation('hero')
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-fade', {
          opacity: 0,
          y: 28,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
        })

        gsap.fromTo(
          '.hero-media',
          { scale: 1.08 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative flex min-h-[100svh] items-end overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/images/simulator/hero-bay.png"
          alt="Simulador de golfe indoor Golf Sport Bar em Balneário Camboriú"
          className="hero-media h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gsb-bg)] via-[color-mix(in_oklab,var(--gsb-bg)_45%,transparent)] to-[color-mix(in_oklab,var(--gsb-bg)_15%,transparent)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 pb-24 pt-36 md:px-8 md:pb-32">
        <div className="hero-fade">
          <BrandLogo />
        </div>
        <h1 className="hero-fade max-w-3xl whitespace-pre-line font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance md:text-7xl lg:text-8xl">
          {t('headline')}
        </h1>
        <p className="hero-fade max-w-lg text-base leading-relaxed text-[var(--gsb-muted)] md:text-lg">
          {t('subhead')}
        </p>
        <div className="hero-fade flex flex-wrap gap-3 pt-2">
          <Button
            className="rounded-full bg-[var(--gsb-accent)] px-7 text-white"
            onPress={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('ctaPrimary')}
          </Button>
          <Button
            variant="secondary"
            className="rounded-full border border-[var(--gsb-border)] bg-transparent px-7"
            onPress={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('ctaSecondary')}
          </Button>
        </div>
      </div>
    </section>
  )
}
