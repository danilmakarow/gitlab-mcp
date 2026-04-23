import { ConsoleLogger, Injectable } from '@nestjs/common';

/**
 * Thin NestJS ConsoleLogger wrapper — kept as a dedicated class so we can
 * layer extra transports or context in the future without churning the imports.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor() {
    super('GitlabMcp', { logLevels: ['error', 'warn', 'log', 'debug'] });
  }
}
