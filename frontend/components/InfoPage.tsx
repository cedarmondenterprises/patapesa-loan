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
      <article className="info-article">
        <p className="eyebrow">PataPesa information</p>
        <h1 className="section-heading">{title}</h1>
        {children}
      </article>
    </Layout>
  );
}
