import Layout from './Layout';
export default function InfoPage({title,children}:{title:string;children:React.ReactNode}){return <Layout title={`${title} | PataPesa`}><article className="prose prose-slate mx-auto max-w-3xl rounded-2xl border bg-white p-8"><h1>{title}</h1>{children}</article></Layout>}
