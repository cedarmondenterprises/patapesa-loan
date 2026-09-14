import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<{ data: AdPlacement[] }>(`/ads?slot=${encodeURIComponent(slot)}`, {
      signal: controller.signal,
    })
      .then(({ data }) => {
        if (active) setAd(data[0] || null);
      })
      .catch(() => {
        if (active) setAd(null);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [slot]);

  if (!ad) return null;
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
