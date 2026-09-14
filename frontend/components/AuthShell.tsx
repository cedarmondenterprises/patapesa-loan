import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import Brand from './Brand';

export default function AuthShell({ title, eyebrow, heading, copy, wide = false, children }: { title: string; eyebrow: string; heading: string; copy: string; wide?: boolean; children: ReactNode }) {
  return (
    <>
      <Head>
        <title>{title} | PataPesa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B1F4B" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className="auth-shell">
        <section className="auth-identity">
          <div className="[&_.text-pata-900]:text-white"><Brand /></div>
          <div className="auth-story"><p className="eyebrow">{eyebrow}</p><h1>{heading}</h1><p>{copy}</p></div>
          <p className="auth-assurance">Secure access · Encrypted identity details · Human review</p>
        </section>
        <section className="auth-form-pane">
          <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
            <div className="mb-10 flex justify-between lg:hidden"><Brand /><Link href="/" className="text-sm font-bold text-pata-800">Back home</Link></div>
            {children}
          </div>
        </section>
      </main>
    </>
  );
}
