import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { EnvironmentVariables } from '@config/env.config';
import { AppLogger } from '@modules/logger/app-logger';
import { AppModule } from '@src/app.module';

/**
 * Bootstraps the NestJS HTTP app for local development.
 * On Vercel the handler at `api/index.ts` takes over and this file is not used.
 */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { logger: new AppLogger() });

  app.use(cookieParser());

  app.enableShutdownHooks();

  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const port = configService.get('PORT', { infer: true });
  const publicUrl = configService.get('PUBLIC_BASE_URL', { infer: true });
  const logger = app.get(AppLogger);

  await app.listen(port);

  logger.log(`GitLab MCP server listening on :${port}`);
  logger.log(`Public URL: ${publicUrl}`);
  logger.log(`MCP endpoint: ${publicUrl}/mcp`);
};

bootstrap().catch((error) => {
  process.stderr.write(`Failed to bootstrap GitLab MCP server: ${String(error)}\n`);
  process.exit(1);
});
