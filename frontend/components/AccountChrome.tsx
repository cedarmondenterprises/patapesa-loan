import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import Brand from './Brand';

type IconName = 'home' | 'file' | 'calendar' | 'person' | 'help' | 'arrow';

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></>,
    file: <><path d="M6 3h8l4 4v14H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h4M9 12h6M9 16h6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const primary = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/dashboard#application-progress', label: 'My loan', icon: 'file' },
  { href: '/dashboard#repayments', label: 'Repayments', icon: 'calendar' },
] as const;
const secondary = [
  { href: '/dashboard#identity-verification', label: 'Identity details', icon: 'person' },
  { href: '/contact', label: 'Help', icon: 'help' },
] as const;

export default function AccountChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="account-app">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="account-sidebar" aria-label="Customer navigation">
        <div className="account-sidebar-brand"><Brand /></div>
        <p className="account-nav-heading">Your account</p>
        <nav aria-label="Account sections">
          {primary.map(({ href, label, icon }) => (
            <Link key={href} href={href} className="account-nav-link" aria-current={router.asPath === href ? 'page' : undefined}>
              <Icon name={icon} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <p className="account-nav-heading account-nav-heading-secondary">Support & settings</p>
        <nav aria-label="Support and settings">
          {secondary.map(({ href, label, icon }) => (
            <Link key={href} href={href} className="account-nav-link">
              <Icon name={icon} /><span>{label}</span>
            </Link>
          ))}
          <Link href="/loans" className="account-nav-link"><Icon name="arrow" /><span>Loan options</span></Link>
        </nav>
        <div className="account-sidebar-foot">Need help with your loan?<br /><Link href="/contact">Contact support →</Link></div>
      </aside>
      <div className="account-main-column">
        <header className="account-topbar">
          <div className="account-mobile-brand"><Brand /></div>
          <span className="account-topbar-label">Customer dashboard</span>
          <Link href="/contact" className="account-topbar-help">Help <span aria-hidden="true">↗</span></Link>
        </header>
        <main id="main-content" tabIndex={-1} className="account-main">{children}</main>
        <footer className="account-footer">
          <span>© {new Date().getFullYear()} PataPesa</span>
          <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div>
        </footer>
      </div>
      <nav className="account-bottom-nav" aria-label="Mobile account navigation">
        {[...primary, secondary[1], secondary[0]].map(({ href, label, icon }) => (
          <Link key={href} href={href} aria-current={router.asPath === href ? 'page' : undefined}>
            <Icon name={icon} /><span>{label === 'Identity details' ? 'Identity' : label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
