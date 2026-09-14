module.exports = {
  ci: {
    collect: {
      url: [
        'https://cedarmondtv.site/',
        'https://cedarmondtv.site/loans',
        'https://cedarmondtv.site/faq',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.65 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'document-title': 'error',
        'meta-description': 'error',
        canonical: 'error',
        'robots-txt': 'error',
        'is-crawlable': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'error',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'frontend/.lighthouseci/reports',
    },
  },
};
