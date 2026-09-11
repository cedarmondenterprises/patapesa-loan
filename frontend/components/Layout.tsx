import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function Layout({ children, title='PataPesa', description='Transparent digital loan applications in Kenya' }: {children:ReactNode;title?:string;description?:string}) {
  return <><Head><title>{title}</title><meta name="description" content={description}/><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"><nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"><Link href="/" className="text-2xl font-black text-emerald-700">PataPesa</Link><div className="flex items-center gap-2"><Link href="/loans" className="px-3 py-2 text-sm font-semibold">Loans</Link><Link href="/login" className="px-3 py-2 text-sm font-semibold">Login</Link><Link href="/register" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Create account</Link></div></nav></header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      <footer className="mt-16 border-t bg-slate-950 text-slate-300"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3"><div><p className="text-xl font-bold text-white">PataPesa</p><p className="mt-2 text-sm">Transparent applications for eligible Kenyan borrowers. Every loan is subject to review and approval.</p></div><div className="flex flex-col gap-2 text-sm"><Link href="/about">About</Link><Link href="/faq">Frequently asked questions</Link><Link href="/contact">Contact support</Link></div><div className="flex flex-col gap-2 text-sm"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><span>© {new Date().getFullYear()} PataPesa</span></div></div></footer>
    </div></>;
}
