import { useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTranslation } from 'react-i18next'
import { services } from '@/app/compositionRoot'
import type { MenuCategory } from '@/domain/menu/MenuItem'
import type { MenuItem } from '@/domain/menu/MenuItem'
import { formatBrl } from '@/shared/lib/formatBrl'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const CATEGORY_ORDER: readonly MenuCategory[] = [
  'classicos',
  'autorais',
  'petiscos',
  'pizzas',
  'burgers',
  'sobremesas',
  'refrigerantes',
  'aguas',
  'energeticos',
  'mocktails',
  'cervejas',
  'caipiras',
  'doses',
  'garrafas',
] as const

export function MenuScrollSection() {
  const { t, i18n } = useTranslation('menu')
  const rootRef = useRef<HTMLElement>(null)
  const [featured, setFeatured] = useState<readonly MenuItem[]>([])
  const [catalog, setCatalog] = useState<readonly MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('classicos')

  useEffect(() => {
    void Promise.all([
      services.getFeaturedMenu.execute(),
      services.getAllMenu.execute(),
    ]).then(([featuredItems, allItems]) => {
      setFeatured(featuredItems)
      setCatalog(allItems)
      const firstWithItems = CATEGORY_ORDER.find((category) =>
        allItems.some((item) => item.category === category),
      )
      if (firstWithItems) setActiveCategory(firstWithItems)
    })
  }, [])

  const categories = useMemo(
    () =>
      CATEGORY_ORDER.filter((category) =>
        catalog.some((item) => item.category === category),
      ),
    [catalog],
  )

  const filteredItems = useMemo(
    () => catalog.filter((item) => item.category === activeCategory),
    [catalog, activeCategory],
  )

  useGSAP(
    () => {
      if (featured.length === 0) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.menu-featured')

        cards.forEach((card) => {
          const copy = card.querySelector('.menu-copy')
          const media = card.querySelector('.menu-media')

          gsap.fromTo(
            copy,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'top 50%',
                scrub: 0.85,
              },
            },
          )

          gsap.fromTo(
            media,
            { opacity: 0.4, y: 40, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                end: 'top 45%',
                scrub: 0.85,
              },
            },
          )
        })
      })

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [featured] },
  )

  return (
    <section id="menu" ref={rootRef} className="relative gsb-atmosphere py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--gsb-accent-soft)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[var(--gsb-muted)] md:text-lg">{t('subtitle')}</p>
      </div>

      <div className="mx-auto mt-20 max-w-5xl space-y-28 px-4 md:mt-28 md:space-y-36 md:px-8">
        {featured.map((item) => (
          <article key={item.id} className="menu-featured flex flex-col items-center text-center">
            <div className="menu-copy max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--gsb-accent-soft)]">
                {t(`categories.${item.category}`)}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">
                {t(item.nameKey)}
              </h3>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-[var(--gsb-muted)] md:text-lg">
                {t(item.descriptionKey)}
              </p>
              <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-[var(--gsb-muted)]">
                {t('priceLabel')}
              </p>
              <p className="mt-1 font-display text-3xl text-[var(--gsb-accent)] md:text-4xl">
                {formatBrl(item.priceBrl, i18n.language)}
              </p>
            </div>
            <div className="menu-media mt-8 w-full overflow-hidden rounded-[1.75rem] md:mt-10 md:rounded-[2.25rem]">
              <img
                src={item.imageSrc}
                alt=""
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-28 max-w-6xl px-4 md:mt-36 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t('fullMenu')}
          </h3>
          <p className="mt-3 text-[var(--gsb-muted)] md:text-lg">{t('fullMenuSubtitle')}</p>
        </div>

        <div
          className="sticky top-16 z-30 -mx-4 mt-10 border-b border-[var(--gsb-border)] bg-[color-mix(in_oklab,var(--gsb-bg)_88%,transparent)] backdrop-blur-xl md:mx-0"
          role="tablist"
          aria-label={t('tabsAria')}
        >
          <div className="flex gap-1 overflow-x-auto px-4 py-3 md:justify-center md:px-0">
            {categories.map((category) => {
              const isActive = category === activeCategory
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition ${
                    isActive
                      ? 'bg-[var(--gsb-accent)] text-white'
                      : 'text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]'
                  }`}
                >
                  {t(`categories.${category}`)}
                </button>
              )
            })}
          </div>
        </div>

        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <li key={item.id} className="border-t border-[var(--gsb-border)] pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {t(item.nameKey)}
                </h4>
                <span className="shrink-0 text-sm font-medium text-[var(--gsb-accent)]">
                  {formatBrl(item.priceBrl, i18n.language)}
                </span>
              </div>
              {t(item.descriptionKey) ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--gsb-muted)]">
                  {t(item.descriptionKey)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        {filteredItems.length === 0 ? (
          <p className="mt-10 text-center text-[var(--gsb-muted)]">{t('emptyCategory')}</p>
        ) : null}
      </div>
    </section>
  )
}
