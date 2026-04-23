/**
 * Root exception class for the application.
 * Carries an HTTP-like status, a machine-readable code, and optional payload context.
 */
export class BaseException extends Error {
  readonly status: number;

  readonly code: string;

  readonly payload?: unknown;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', payload?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}
