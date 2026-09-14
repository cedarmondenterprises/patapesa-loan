import Script from 'next/script';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type SiteIntegration = {
  provider: 'GOOGLE_ANALYTICS' | 'GOOGLE_TAG_MANAGER' | 'PLAUSIBLE' | 'GOOGLE_ADSENSE';
  publicId: string;
  homeSlot: string | null;
  loansSlot: string | null;
};

export const consentKey = 'patapesa-privacy-v1';
type Consent = 'accepted' | 'essential';

declare global {
  interface Window {
    dataLayer?: unknown[];
    adsbygoogle?: Record<string, never>[];
  }
}

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(consentKey);
  return value === 'accepted' || value === 'essential' ? value : null;
}

export function TrackingAndAds() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [integrations, setIntegrations] = useState<SiteIntegration[]>([]);

  useEffect(() => {
    const saved = readConsent();
    setConsent(saved);
    setChoiceMade(Boolean(saved));
    setReady(true);
    api<{ data: SiteIntegration[] }>('/integrations')
      .then(({ data }) => setIntegrations(data))
      .catch(() => setIntegrations([]));
  }, []);

  const choose = (value: Consent) => {
    window.localStorage.setItem(consentKey, value);
    setConsent(value);
    setChoiceMade(true);
    window.dispatchEvent(new CustomEvent('patapesa:privacy-choice', { detail: value }));
  };
  const changeChoice = () => {
    window.localStorage.removeItem(consentKey);
    setConsent(null);
    setChoiceMade(false);
    window.location.reload();
  };
  const enabled = (provider: SiteIntegration['provider']) =>
    integrations.find((item) => item.provider === provider);
  const ga = enabled('GOOGLE_ANALYTICS');
  const gtm = enabled('GOOGLE_TAG_MANAGER');
  const plausible = enabled('PLAUSIBLE');
  const adsense = enabled('GOOGLE_ADSENSE');
  const allowed = consent === 'accepted';

  return (
    <>
      {allowed && ga && (
        <>
          <Script
            id="patapesa-ga-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga.publicId)}`}
            strategy="afterInteractive"
          />
          <Script id="patapesa-ga-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config',${JSON.stringify(ga.publicId)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {allowed && gtm && (
        <Script id="patapesa-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtm.publicId)});`}
        </Script>
      )}
      {allowed && plausible && (
        <Script
          id="patapesa-plausible"
          src="https://plausible.io/js/script.js"
          data-domain={plausible.publicId}
          strategy="afterInteractive"
        />
      )}
      {allowed && adsense && (
        <Script
          id="patapesa-adsense"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense.publicId)}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      {ready && !choiceMade && (
        <section className="privacy-consent" role="dialog" aria-label="Privacy choices">
          <div>
            <strong>Your privacy choices</strong>
            <p>
              We use optional analytics to improve PataPesa and advertising technology to fund the
              service. Essential account and security features always remain active.
            </p>
          </div>
          <div className="privacy-actions">
            <button type="button" className="button button-secondary" onClick={() => choose('essential')}>
              Essential only
            </button>
            <button type="button" className="button button-primary" onClick={() => choose('accepted')}>
              Allow analytics &amp; ads
            </button>
          </div>
        </section>
      )}
      {ready && choiceMade && (
        <button type="button" className="privacy-reopen" onClick={changeChoice}>
          Privacy choices
        </button>
      )}
    </>
  );
}
