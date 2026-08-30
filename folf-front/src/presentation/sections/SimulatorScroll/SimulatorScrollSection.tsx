import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTranslation } from 'react-i18next'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const slides = [
  { key: 'bay', image: '/images/simulator/bay.png' },
  { key: 'tech', image: '/images/simulator/tech.png' },
  { key: 'night', image: '/images/simulator/night.png' },
] as const

export function SimulatorScrollSection() {
  const { t } = useTranslation('simulator')
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          reduce: '(prefers-reduced-motion: reduce)',
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { reduce, desktop } = context.conditions ?? {}
          if (reduce) return

          const panels = gsap.utils.toArray<HTMLElement>('.sim-panel')

          if (desktop && stageRef.current) {
            gsap.set(panels, { autoAlpha: 0, scale: 0.94 })
            gsap.set(panels[0], { autoAlpha: 1, scale: 1 })

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: stageRef.current,
                start: 'top top',
                end: () => `+=${panels.length * 110}%`,
                pin: true,
                scrub: 0.8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            })

            panels.forEach((panel, index) => {
              if (index === 0) return
              const prev = panels[index - 1]
              tl.to(
                prev,
                { autoAlpha: 0, scale: 1.04, duration: 1, ease: 'power1.inOut' },
                index,
              )
              tl.fromTo(
                panel,
                { autoAlpha: 0, scale: 0.94 },
                { autoAlpha: 1, scale: 1, duration: 1, ease: 'power1.inOut' },
                index,
              )
            })
          } else {
            panels.forEach((panel) => {
              gsap.from(panel, {
                opacity: 0,
                y: 36,
                duration: 0.85,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: panel,
                  start: 'top 82%',
                },
              })
            })
          }
        },
      )

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section id="simulator" ref={rootRef} className="relative bg-[var(--gsb-bg)]">
      <div className="mx-auto max-w-4xl px-4 pt-28 text-center md:px-8 md:pt-36">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--gsb-accent-soft)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[var(--gsb-muted)] md:text-lg">{t('subtitle')}</p>
      </div>

      <div
        ref={stageRef}
        className="relative mt-12 flex min-h-[100svh] w-full flex-col items-center justify-center gap-16 overflow-hidden py-10 md:mt-16 md:block md:gap-0 md:py-0 md:h-[100svh]"
      >
        {slides.map((slide, index) => (
          <article
            key={slide.key}
            className={`sim-panel relative flex w-full items-center justify-center px-4 md:absolute md:inset-0 md:px-8 ${
              index === 0 ? 'md:z-10' : 'md:z-0'
            }`}
          >
            <div className="flex w-full max-w-5xl flex-col items-center justify-center">
              <div className="sim-media w-full overflow-hidden rounded-[1.75rem] shadow-[0_24px_80px_-48px_var(--gsb-glow)] md:rounded-[2.25rem]">
                <img
                  src={slide.image}
                  alt={t(`slides.${slide.key}.imageAlt`)}
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
              <div className="mt-7 max-w-2xl text-center md:mt-9">
                <h3 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
                  {t(`slides.${slide.key}.title`)}
                </h3>
                <p className="mt-3 text-[var(--gsb-muted)] md:text-lg">
                  {t(`slides.${slide.key}.copy`)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
