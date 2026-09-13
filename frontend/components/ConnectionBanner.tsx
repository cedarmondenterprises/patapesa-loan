import { useEffect, useState } from 'react';

export default function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (online) return null;
  return (
    <div className="connection-banner" role="status" aria-live="polite">
      You are offline. Your unfinished form remains saved in this browser tab.
    </div>
  );
}
