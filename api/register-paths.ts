import { resolve } from 'path';

import { register } from 'tsconfig-paths';

/**
 * Registers TypeScript path aliases at runtime so that the compiled
 * Vercel function can resolve `@modules/*`, `@config/*`, etc. without
 * relying on tsconfig.json being shipped or on a build-time rewriter.
 */
register({
  baseUrl: resolve(__dirname, '..'),
  paths: {
    '@modules/*': ['src/modules/*'],
    '@config/*': ['src/config/*'],
    '@common/*': ['src/common/*'],
    '@src/*': ['src/*'],
    '@root/*': ['./*'],
  },
});
