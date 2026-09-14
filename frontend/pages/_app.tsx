import type { AppProps } from 'next/app';
import ConnectionBanner from '../components/ConnectionBanner';
import { TrackingAndAds } from '../components/TrackingAndAds';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ConnectionBanner />
      <Component {...pageProps} />
      <TrackingAndAds />
    </>
  );
}

export default MyApp;
