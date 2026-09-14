import type { AppProps } from 'next/app';
import Head from 'next/head';
import ConnectionBanner from '../components/ConnectionBanner';
import '../styles.css';
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>PataPesa Administration</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111f2d" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ConnectionBanner />
      <Component {...pageProps} />
    </>
  );
}
