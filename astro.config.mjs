import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://financewithflow.com',
  adapter: netlify(),
  integrations: [
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      filter: (page) => !page.includes('/keystatic'),
    }),
  ],
  redirects: {
    '/faqs': '/about/#faqs',
  },
});
