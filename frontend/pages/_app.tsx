import type { AppProps } from 'next/app';
import ConnectionBanner from '../components/ConnectionBanner';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ConnectionBanner />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
