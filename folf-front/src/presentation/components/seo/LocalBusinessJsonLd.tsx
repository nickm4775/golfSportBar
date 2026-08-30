import { Helmet } from 'react-helmet-async'
import { buildLocalBusinessJsonLd } from '@/shared/seo/siteSeo'

export function LocalBusinessJsonLd() {
  const jsonLd = buildLocalBusinessJsonLd()

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
