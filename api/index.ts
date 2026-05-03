import type { IncomingMessage, ServerResponse } from 'http';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from '../dist/app.module';
import { AppLogger } from '../dist/modules/logger/app-logger';

type NodeRequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cachedRequestHandler: NodeRequestHandler | undefined;

/**
 * Bootstraps the NestJS app once per warm Vercel function instance and caches
 * the underlying Express request handler. Subsequent invocations reuse it.
 */
const getRequestHandler = async (): Promise<NodeRequestHandler> => {
  if (cachedRequestHandler) {
    return cachedRequestHandler;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new AppLogger(),
  });

  app.use(cookieParser());

  await app.init();

  cachedRequestHandler = app.getHttpAdapter().getInstance() as NodeRequestHandler;

  return cachedRequestHandler;
};

/**
 * Vercel Node function entry. Forwards every request to the NestJS app.
 */
export default async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const requestHandler = await getRequestHandler();

  requestHandler(req, res);
};
