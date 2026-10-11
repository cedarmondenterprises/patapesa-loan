import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from './Brand';
import AccountChrome from './AccountChrome';

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
  const accountPage = router.pathname === '/dashboard';
  const nav = accountPage
    ? [
        ['/dashboard', 'My account'],
        ['/loans', 'Loan options'],
        ['/contact', 'Support'],
      ]
    : [
        ['/loans', 'Loan options'],
        ['/about', 'How it works'],
        ['/faq', 'Help centre'],
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
        <meta name="theme-color" content="#F97316" />
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
        <meta property="og:image" content={`${SITE_URL}/social-preview.png`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/social-preview.png`} />
        <link rel="icon" href="/favicon.svg" />
        {!preventIndexing && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>
      {accountPage ? (
        <AccountChrome>{children}</AccountChrome>
      ) : (
        <div className="site-shell">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <header className="site-header">
            <nav className="site-nav" aria-label="Main navigation">
              <Brand />
              <div className="desktop-nav">
                {nav.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={router.asPath === href ? 'page' : undefined}
                    className={router.asPath === href ? 'active' : ''}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div className="nav-actions">
                <Link href="/dashboard" className="text-link nav-dashboard-link">
                  My loan
                </Link>
                {!accountPage && (
                  <Link href="/#estimate" className="button button-primary button-small">
                    Get an estimate
                  </Link>
                )}
                <button
                  className={`menu-button ${open ? 'is-open' : ''}`}
                  aria-label="Toggle navigation"
                  aria-expanded={open}
                  aria-controls="mobile-navigation"
                  onClick={() => setOpen(!open)}
                >
                  <span />
                  <span />
                  <span />
                </button>
              </div>
            </nav>
            {open && (
              <div id="mobile-navigation" className="mobile-nav mobile-nav-open">
                {nav.map(([href, label]) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                ))}
                <Link href="/login">Sign in</Link>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Track my loan
                </Link>
                <Link href="/register">Apply</Link>
              </div>
            )}
          </header>
          <main id="main-content" tabIndex={-1} className="site-main">
            {children}
          </main>
          <nav className="public-mobile-tabs" aria-label="Mobile navigation">
            <MobileTab href="/" label="Home" icon="home" active={router.pathname === '/'} />
            <MobileTab
              href="/loans"
              label="Loans"
              icon="wallet"
              active={router.pathname === '/loans'}
            />
            <MobileTab href="/faq" label="Help" icon="help" active={router.pathname === '/faq'} />
            <MobileTab href="/dashboard" label="Account" icon="person" active={false} />
          </nav>
          <footer className="site-footer">
            <div className="footer-grid">
              <div>
                <Brand />
                <p className="footer-copy">
                  Know the cost. Understand the process. Manage your borrowing.
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
      )}
    </>
  );
}

function MobileTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: 'home' | 'wallet' | 'help' | 'person';
  active: boolean;
}) {
  const paths = {
    home: 'M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5.5v-7h-5v7H4a1 1 0 0 1-1-1V10.8Z',
    wallet:
      'M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm13 4h5v4h-5a2 2 0 1 1 0-4Z',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5.2v.2m-2.2-8.1a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.2 1-1.2 1.8v.4',
    person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  };
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={paths[icon]} />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
