import { BaseException } from './base.exception';

/**
 * Represents a GitLab resource that could not be found.
 */
export class NotFoundException extends BaseException {
  constructor(message: string, payload?: unknown) {
    super(message, 404, 'NOT_FOUND', payload);
  }
}
