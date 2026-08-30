import { Helmet } from 'react-helmet-async'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
} from '@/shared/seo/siteSeo'

type DocumentSeoProps = {
  title?: string
  description?: string
  path?: string
  robots?: string
  ogImage?: string
  includeSocial?: boolean
}

export function DocumentSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  robots = 'index,follow',
  ogImage = DEFAULT_OG_IMAGE,
  includeSocial = true,
}: DocumentSeoProps) {
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(ogImage)

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      {includeSocial ? (
        <>
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="pt_BR" />
          <meta property="og:url" content={url} />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageUrl} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={imageUrl} />
        </>
      ) : null}
    </Helmet>
  )
}

export function HomeDocumentSeo() {
  return <DocumentSeo path="/" robots="index,follow" includeSocial />
}

export function LoginDocumentSeo() {
  return (
    <DocumentSeo
      title={`Login | ${SITE_NAME}`}
      description={`Acesso da equipe ${SITE_NAME}.`}
      path="/login"
      robots="noindex,nofollow"
      includeSocial={false}
    />
  )
}

export function AppDocumentSeo() {
  return (
    <DocumentSeo
      title={`App | ${SITE_NAME}`}
      description={`Painel interno ${SITE_NAME}.`}
      path="/app"
      robots="noindex,nofollow"
      includeSocial={false}
    />
  )
}
