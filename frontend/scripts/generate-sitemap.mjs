import { writeFile } from 'node:fs/promises';

const origin = 'https://cedarmondtv.site';
const paths = ['/', '/loans', '/about', '/faq', '/contact', '/terms', '/privacy'];
const lastModified = new Date().toISOString().slice(0, 10);
const urls = paths.map((path) => `  <url><loc>${new URL(path, origin).href}</loc><lastmod>${lastModified}</lastmod></url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml, 'utf8');
console.log(`Generated sitemap.xml with ${paths.length} public URLs.`);
