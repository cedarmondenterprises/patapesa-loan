import { appendFile } from 'node:fs/promises';

const origin = process.env.SEO_ORIGIN || 'https://cedarmondtv.site';
const key = 'd94c7f5362114eb7a95f35e727a4c9d8';
const keyLocation = `${origin}/${key}.txt`;
const paths = (process.env.INDEXNOW_PATHS || '')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
if (!paths.length) throw new Error('Set INDEXNOW_PATHS to public paths that have changed in production.');
const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
if (!sitemapResponse.ok) throw new Error(`Could not read production sitemap: HTTP ${sitemapResponse.status}`);

const sitemap = await sitemapResponse.text();
const publicUrls = new Set([...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]));
const urlList = [...new Set(paths.map((path) => {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#')) {
    throw new Error(`Expected a public path starting with /: ${path}`);
  }
  const url = new URL(path, origin).href;
  if (!publicUrls.has(url)) throw new Error(`${path} is not in the production sitemap.`);
  return url;
}))];

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
});

if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected the submission: HTTP ${response.status}`);
const message = `Submitted ${urlList.length} PataPesa URLs to IndexNow (HTTP ${response.status}).`;
console.log(message);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## IndexNow\n\n${message}\n`);
