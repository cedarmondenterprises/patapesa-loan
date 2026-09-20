import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import Brand from './Brand';
export default function AuthShell({
  title,
  eyebrow,
  heading,
  copy,
  wide = false,
  children,
}: {
  title: string;
  eyebrow: string;
  heading: string;
  copy: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{title} | PataPesa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16332f" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <a href="#auth-content" className="skip-link">
        Skip to form
      </a>
      <header className="auth-topbar">
        <Brand />
        <Link href="/contact">Need help?</Link>
      </header>
      <main className={`auth-layout ${wide ? 'auth-layout-wide' : ''}`}>
        <aside className="auth-context">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{heading}</h1>
          <p>{copy}</p>
          <div className="auth-context-note">
            <strong>Your information, handled carefully.</strong>
            <p>
              Identity details are encrypted. Authorised staff review the information you submit.
            </p>
            <Link href="/privacy">Read our privacy policy →</Link>
          </div>
          <Link className="auth-back" href="/">
            ← Back to PataPesa
          </Link>
        </aside>
        <section id="auth-content" tabIndex={-1} className="auth-card">
          {children}
        </section>
      </main>
      <footer className="auth-bottom">
        <span>© {new Date().getFullYear()} PataPesa</span>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </>
  );
}
