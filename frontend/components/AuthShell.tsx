import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import Brand from './Brand';

export default function AuthShell({
  title,
  eyebrow,
  heading,
  copy,
  wide = false,
  children,
}: {
  title: string;
  eyebrow: string;
  heading: string;
  copy: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{title} | PataPesa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#123c32" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main className="min-h-screen bg-[#fffdf7] lg:grid lg:grid-cols-[.82fr_1.18fr]">
        <section className="hidden bg-pata-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="[&_.text-pata-900]:text-white">
            <Brand />
          </div>
          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-[#d7a16f]">{eyebrow}</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.06] tracking-[-.035em]">
              {heading}
            </h1>
            <p className="mt-6 leading-7 text-white/65">{copy}</p>
          </div>
          <p className="text-xs text-white/45">
            Secure access · Encrypted identity details · Human review
          </p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
            <div className="mb-10 flex justify-between lg:hidden">
              <Brand />
              <Link href="/" className="text-sm font-bold text-pata-800">
                Back home
              </Link>
            </div>
            {children}
          </div>
        </section>
      </main>
    </>
  );
}
