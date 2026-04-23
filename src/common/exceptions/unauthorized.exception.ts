import { BaseException } from './base.exception';

/**
 * Represents a request rejected by GitLab due to missing or invalid credentials.
 */
export class UnauthorizedException extends BaseException {
  constructor(message: string, payload?: unknown) {
    super(message, 401, 'UNAUTHORIZED', payload);
  }
}
