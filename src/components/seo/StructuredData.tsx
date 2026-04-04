import { absoluteUrl, listingPriceCurrency, siteOrigin } from '../../lib/siteUrl';

interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string;
  price?: number;
  purity: string;
  category: string;
  sku: string;
  url: string;
}

export function ProductStructuredData({
  name,
  description,
  image,
  price,
  purity,
  category,
  sku,
  url,
}: ProductStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    description,
    image: absoluteUrl(image),
    category,
    sku,
    brand: {
      '@type': 'Brand',
      name: 'Laminin Peptide Lab',
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(url),
      priceCurrency: listingPriceCurrency(),
      price: price || undefined,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Laminin Peptide Lab',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Purity',
        value: purity,
      },
      {
        '@type': 'PropertyValue',
        name: 'Form',
        value: 'Lyophilised powder',
      },
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Research laboratories',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const origin = siteOrigin();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Laminin Peptide Lab',
    url: origin,
    logo: `${origin}/images/brand/logo-colour.png`,
    description:
      'Laminin Peptide Lab supplies high-purity research peptides for laboratory use. All compounds are analytically verified with Certificates of Analysis available.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'info@lamininpeptab.com.au',
    },
    sameAs: [
      // Add social media links here when available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const origin = siteOrigin();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Laminin Peptide Lab',
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/library?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
