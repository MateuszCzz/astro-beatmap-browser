// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  trailingSlash: "never",
  build: { format: "file" },
  adapter: cloudflare(),
  integrations: [vue()],
  site: "https://osufeniks.com",
});