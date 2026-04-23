import { BaseException } from './base.exception';

/**
 * Represents an invalid request against the GitLab API or MCP tool input.
 */
export class BadRequestException extends BaseException {
  constructor(message: string, payload?: unknown) {
    super(message, 400, 'BAD_REQUEST', payload);
  }
}
