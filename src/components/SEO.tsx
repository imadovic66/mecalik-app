import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  path: string          // e.g. "/services"
  image?: string
  type?: string
  jsonLd?: object | object[]
  noindex?: boolean
}

export default function SEO({ title, description, path, image = 'https://mecalik.com/hero-photo.png', type = 'website', jsonLd, noindex }: SEOProps) {
  const url = `https://mecalik.com${path}`
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="fr_MA" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="alternate" hrefLang="fr" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  )
}
