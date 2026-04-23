import path from 'node:path';

import { register as registerTsconfigPaths } from 'tsconfig-paths';

/**
 * Register TypeScript path aliases at runtime.
 *
 * Locally, `nest build` rewrites `@/` imports into relative paths in the compiled
 * output. On Vercel, `@vercel/node` compiles this file (and transitively our src/*)
 * with plain `tsc`, which does NOT rewrite aliases — so the `@/...` strings end up
 * in the shipped .js files and fail at require time.
 *
 * We hook Node's module resolution here before any downstream import runs.
 * Paths are hard-coded so we don't need to ship `tsconfig.json` with the bundle.
 */
registerTsconfigPaths({
  baseUrl: path.join(__dirname, '..'),
  paths: {
    '@/utils/*': ['src/common/utils/*'],
    '@/config/*': ['src/config/*'],
    '@/services/*': ['src/common/services/*'],
    '@/exceptions/*': ['src/common/exceptions/*'],
    '@/modules/*': ['src/modules/*'],
    '@/*': ['src/*'],
  },
});

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import type { Handler } from 'aws-lambda';

import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/modules/logger/app-logger';

let cachedHandler: Handler | undefined;

/**
 * Bootstraps the NestJS app once per warm Vercel function instance and caches
 * the resulting express handler. Subsequent invocations reuse the same app.
 */
const getHandler = async (): Promise<Handler> => {
  if (cachedHandler) {
    return cachedHandler;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new AppLogger(),
  });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance() as Parameters<
    typeof serverlessExpress
  >[0]['app'];

  cachedHandler = serverlessExpress({ app: expressApp });

  return cachedHandler;
};

/**
 * Vercel Node function entry. Forwards every request to the NestJS app.
 */
export default async (req: unknown, res: unknown): Promise<unknown> => {
  const handler = await getHandler();

  return handler(req as Parameters<Handler>[0], res as Parameters<Handler>[1], () => undefined);
};
