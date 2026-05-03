import './register-paths';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import type { Handler } from 'aws-lambda';
import cookieParser from 'cookie-parser';

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

  app.use(cookieParser());

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
