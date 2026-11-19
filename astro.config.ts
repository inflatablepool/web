import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

import mdx from '@astrojs/mdx';

import siteConfig from './vendor/integration';
import imageOptimizer from './vendor/integration/image-optimizer';
import imgDimensions from './vendor/integration/img-dimensions';
import yaml from '@rollup/plugin-yaml';
import tailwindcss from '@tailwindcss/vite';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const locale = process.env.SITE_LOCALE || 'en';

const configFile = locale === 'en' ? './src/config.yaml' : `./src/config.${locale}.yaml`;

export default defineConfig({
  output: 'static',

  // Astro 7 默认改为 'jsx'（JSX 空白规则会把内联元素间的文字粘在一起）。
  // 显式固定为 true 以保持 v6 的 HTML 感知压缩行为。
  compressHTML: true,

  redirects: {
    // P0-5：/zh/ 无页面（仓库无 zh 路由），防线上残留软 200
    '/zh/': '/',
    // 语言下架（63a1b18）：ja/ko 已删除，旧 URL 用 meta-refresh + noindex + canonical 壳页回收权重
    '/ja/': '/',
    '/ko/': '/',
  },
  integrations: [
    mdx(),

    imageOptimizer(),

    imgDimensions(),

    siteConfig({
      config: configFile,
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
  },

  vite: {
    plugins: [yaml(), tailwindcss()],

    optimizeDeps: {
      exclude: ['@keystatic/core'],
    },

    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
        ...(locale !== 'en'
          ? {
              '~/data/site/navigation.yaml': path.resolve(__dirname, `./src/data/site/navigation.${locale}.yaml`),
            }
          : {}),
      },
    },
  },
});
