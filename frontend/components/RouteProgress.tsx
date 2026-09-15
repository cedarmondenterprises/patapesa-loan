import Router from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function RouteProgress() {
  const [visible, setVisible] = useState(false);
  const delay = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      if (delay.current) window.clearTimeout(delay.current);
      delay.current = window.setTimeout(() => setVisible(true), 120);
    };
    const finish = () => {
      if (delay.current) window.clearTimeout(delay.current);
      delay.current = null;
      setVisible(false);
    };

    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', finish);
    Router.events.on('routeChangeError', finish);
    return () => {
      finish();
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', finish);
      Router.events.off('routeChangeError', finish);
    };
  }, []);

  return visible ? (
    <div className="route-progress" aria-hidden="true">
      <span />
    </div>
  ) : null;
}
