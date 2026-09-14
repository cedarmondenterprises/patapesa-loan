import { appendFile } from 'node:fs/promises';

const origin = process.env.SEO_ORIGIN || 'https://cedarmondtv.site';
const publicPaths = ['/', '/loans', '/about', '/faq', '/contact', '/terms', '/privacy'];
const failures = [];
const results = [];

function pick(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || '';
}

for (const path of publicPaths) {
  const url = new URL(path, origin).href;
  const response = await fetch(url, { headers: { 'user-agent': 'PataPesa-SEO-Monitor/1.0' }, redirect: 'follow' });
  const html = await response.text();
  const title = pick(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || pick(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const canonical = pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || pick(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const indexable = !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const expectedCanonical = new URL(path, origin).href.replace(/\/$/, path === '/' ? '' : '/');

  if (!response.ok) failures.push(`${url}: HTTP ${response.status}`);
  if (title.length < 15 || title.length > 65) failures.push(`${url}: title length is ${title.length}`);
  if (description.length < 80 || description.length > 170) failures.push(`${url}: description length is ${description.length}`);
  if (!canonical || canonical.replace(/\/$/, '') !== expectedCanonical.replace(/\/$/, '')) failures.push(`${url}: canonical is missing or incorrect`);
  if (h1Count !== 1) failures.push(`${url}: expected one H1, found ${h1Count}`);
  if (!indexable) failures.push(`${url}: public page is marked noindex`);
  results.push({ path, status: response.status, title, descriptionLength: description.length, h1Count });
}

const robotsResponse = await fetch(`${origin}/robots.txt`);
const robots = await robotsResponse.text();
if (!robotsResponse.ok) failures.push('robots.txt is unavailable');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) failures.push('robots.txt does not declare the production sitemap');

const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
const sitemap = await sitemapResponse.text();
if (!sitemapResponse.ok || !sitemap.includes('<urlset')) failures.push('sitemap.xml is unavailable or invalid');
for (const path of publicPaths) {
  const url = new URL(path, origin).href;
  if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap.xml is missing ${url}`);
}

const summary = [
  '# PataPesa SEO health report',
  '',
  '| Page | HTTP | Title | Description | H1 |',
  '|---|---:|---|---:|---:|',
  ...results.map((item) => `| ${item.path} | ${item.status} | ${item.title.replace(/\|/g, '\\|')} | ${item.descriptionLength} | ${item.h1Count} |`),
  '',
  failures.length ? `## Problems\n\n${failures.map((item) => `- ${item}`).join('\n')}` : '## Result\n\nAll technical SEO checks passed.',
  '',
].join('\n');

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
if (failures.length) process.exit(1);
