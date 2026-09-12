import Layout from './Layout';
export default function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Layout title={`${title} | PataPesa`}>
      <article className="prose prose-slate mx-auto max-w-3xl border-t-4 border-pata-900 bg-[#fffdf7] p-7 shadow-quiet sm:p-12">
        <p className="eyebrow">PataPesa information</p>
        <h1 className="section-heading">{title}</h1>
        {children}
      </article>
    </Layout>
  );
}
