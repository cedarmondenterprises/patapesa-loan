import Layout from './Layout';
export default function InfoPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Layout title={`${title} | PataPesa`} description={description}>
      <article className="info-article">
        <p className="eyebrow">PataPesa information</p>
        <h1 className="section-heading">{title}</h1>
        {children}
      </article>
    </Layout>
  );
}
