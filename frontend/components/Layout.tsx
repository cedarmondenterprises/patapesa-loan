import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from './Brand';

const SITE_URL = 'https://cedarmondtv.site';
const PRIVATE_PATHS = new Set([
  '/dashboard',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export default function Layout({
  children,
  title = 'PataPesa | Mobile loans in Kenya',
  description = 'Compare mobile loan options in Kenya, review estimated interest and fees, and apply online through PataPesa.',
  canonicalPath,
  noIndex = false,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const nav = [
    ['/', 'Home'],
    ['/loans', 'Apply'],
    ['/dashboard#application-progress', 'Track application'],
    ['/about', 'How it works'],
    ['/faq', 'Help'],
  ];
  const path = canonicalPath || router.pathname;
  const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;
  const preventIndexing = noIndex || PRIVATE_PATHS.has(router.pathname);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'PataPesa',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        areaServed: { '@type': 'Country', name: 'Kenya' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'PataPesa',
        url: SITE_URL,
        inLanguage: 'en-KE',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B1F4B" />
        <meta
          name="robots"
          content={preventIndexing ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PataPesa" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/social-preview.svg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/social-preview.svg`} />
        <link rel="icon" href="/favicon.svg" />
        {!preventIndexing && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>
      <div className="site-shell">
        <header className="site-header">
          <nav className="site-nav" aria-label="Main navigation">
            <Brand />
            <div className="desktop-nav">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className={router.pathname === href ? 'active' : ''}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="nav-actions">
              <Link href="/login" className="text-link">
                Sign in
              </Link>
              <Link href="/register" className="button button-primary button-small">
                Apply
              </Link>
              <button
                className={`menu-button ${open ? 'is-open' : ''}`}
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </nav>
          {open && (
            <div className="mobile-nav mobile-nav-open">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
              <Link href="/login">Sign in</Link>
              <Link href="/register">Apply</Link>
            </div>
          )}
        </header>
        <main key={router.asPath} className="site-main route-view">
          {children}
        </main>
        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <Brand />
              <p className="footer-copy">
                Loan estimates, applications and account tracking in one place.
              </p>
            </div>
            <div className="footer-links">
              <strong>Customer</strong>
              <Link href="/loans">Loans</Link>
              <Link href="/about">Application process</Link>
              <Link href="/faq">Help</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div className="footer-links">
              <strong>Legal</strong>
              <Link href="/terms">Terms and conditions</Link>
              <Link href="/privacy">Privacy policy</Link>
              <a href="https://admin.cedarmondtv.site">Staff access</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} PataPesa</span>
            <span>
              All applications are subject to identity, eligibility and affordability assessment.
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
