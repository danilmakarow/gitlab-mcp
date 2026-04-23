import { BaseException } from './base.exception';

/**
 * Represents an unexpected failure while talking to GitLab or within the MCP server.
 */
export class InternalServerErrorException extends BaseException {
  constructor(message: string, payload?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', payload);
  }
}
