import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from './Brand';

export default function Layout({
  children,
  title = 'PataPesa',
  description = 'Transparent digital loan applications in Kenya',
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const nav = [
    ['/', 'Home'],
    ['/loans', 'Loan options'],
    ['/about', 'How it works'],
    ['/faq', 'Help centre'],
  ];
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b2339" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="/social-preview.svg" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <div className="site-shell">
        <div className="service-rail">
          <div>
            <span>Transparent estimates before you apply</span>
            <span>Secure customer account</span>
            <Link href="/contact">Need help?</Link>
          </div>
        </div>
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
                Start application
              </Link>
              <button
                className="menu-button"
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
            <div className="mobile-nav">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
              <Link href="/login">Sign in</Link>
              <Link href="/register">Start application</Link>
            </div>
          )}
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <Brand />
              <p className="footer-copy">
                A clearer digital lending journey—from the first estimate to the final repayment.
              </p>
            </div>
            <div className="footer-links">
              <strong>Explore</strong>
              <Link href="/loans">Loan options</Link>
              <Link href="/about">How it works</Link>
              <Link href="/faq">Help centre</Link>
              <Link href="/contact">Contact support</Link>
            </div>
            <div className="footer-links">
              <strong>Important information</strong>
              <Link href="/terms">Terms and conditions</Link>
              <Link href="/privacy">Privacy policy</Link>
              <a href="https://admin.cedarmondtv.site">Staff access</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} PataPesa</span>
            <span>Approval is subject to identity, eligibility and affordability assessment.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
