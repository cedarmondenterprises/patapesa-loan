import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { readConsent, SiteIntegration } from './TrackingAndAds';

export type AdPlacement = {
  slot: 'HOME_BELOW_PLANNER' | 'LOANS_BELOW_HEADER';
  sponsor: string;
  headline: string;
  body: string;
  ctaLabel: string;
  targetUrl: string;
  imageUrl: string | null;
};

export default function AdSlot({ slot }: { slot: AdPlacement['slot'] }) {
  const [ad, setAd] = useState<AdPlacement | null>(null);
  const [adsense, setAdsense] = useState<SiteIntegration | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      api<{ data: AdPlacement[] }>(`/ads?slot=${encodeURIComponent(slot)}`, {
        signal: controller.signal,
      }),
      api<{ data: SiteIntegration[] }>('/integrations', { signal: controller.signal }),
    ])
      .then(([ads, integrations]) => {
        if (!active) return;
        setAd(ads.data[0] || null);
        setAdsense(
          integrations.data.find((item) => item.provider === 'GOOGLE_ADSENSE') || null,
        );
        setConsented(readConsent() === 'accepted');
      })
      .catch(() => {
        if (active) {
          setAd(null);
          setAdsense(null);
        }
      });
    const updateConsent = () => setConsented(readConsent() === 'accepted');
    window.addEventListener('patapesa:privacy-choice', updateConsent);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('patapesa:privacy-choice', updateConsent);
    };
  }, [slot]);

  useEffect(() => {
    if (!ad && adsense && consented) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // Ad blockers and delayed provider scripts should not affect the page.
      }
    }
  }, [ad, adsense, consented, slot]);

  if (ad) {
    const external = !ad.targetUrl.startsWith('/');
    return (
      <aside className="ad-placement" aria-label={`Advertisement from ${ad.sponsor}`}>
        {ad.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
        )}
        <div className="ad-copy">
          <small>Advertisement · {ad.sponsor}</small>
          <strong>{ad.headline}</strong>
          <p>{ad.body}</p>
        </div>
        <a
          href={ad.targetUrl}
          className="button button-secondary button-small"
          {...(external ? { target: '_blank', rel: 'sponsored noopener noreferrer' } : {})}
        >
          {ad.ctaLabel}
        </a>
      </aside>
    );
  }

  const adSlot = slot === 'HOME_BELOW_PLANNER' ? adsense?.homeSlot : adsense?.loansSlot;
  if (!consented || !adsense || !adSlot) return null;
  return (
    <aside className="network-ad-placement" aria-label="Advertisement">
      <small>Advertisement</small>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsense.publicId}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
