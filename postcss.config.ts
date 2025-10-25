/**
 * Hardened PostCSS configuration for ES Modules (Next.js 15 + Tailwind 3.4)
 * Handles full AI-optimized build pipelines with strict defaults.
 * Compatible with: Codespaces, Vercel, & modern Node 20 / 22 servers.
 *
 * Notes:
 *  – Uses pure ESM syntax for modern toolchains.
 *  – Adds autoprefixer for browser compatibility.
 *  – Uses environment checks for production hardening.
 */

import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const isProd = process.env.NODE_ENV === 'production';

const config = {
  plugins: [
    tailwindcss(),
    autoprefixer({
      grid: true,
      flexbox: 'no-2009',
      overrideBrowserslist: [
        '>0.5%',
        'last 3 versions',
        'Firefox ESR',
        'not dead',
      ],
    }),
    // Add real optimization only during production builds
    ...(isProd
      ? [
          // Example of hardening plugin if needed
          // cssnano({ preset: 'default' }),
        ]
      : []),
  ],
};

export default config;
