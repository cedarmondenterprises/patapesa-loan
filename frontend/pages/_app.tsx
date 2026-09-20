import type { AppProps } from 'next/app';
import ConnectionBanner from '../components/ConnectionBanner';
import RouteProgress from '../components/RouteProgress';
import { TrackingAndAds } from '../components/TrackingAndAds';
import '../styles/globals.css';
import '../styles/design-system.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <RouteProgress />
      <ConnectionBanner />
      <Component {...pageProps} />
      <TrackingAndAds />
    </>
  );
}

export default MyApp;
