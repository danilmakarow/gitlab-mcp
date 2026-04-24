import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../../../config/env.config';
import {
  BadRequestException,
  BaseException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '../../../common/exceptions/index';
import { AppLogger } from '../../logger/app-logger';
import { GitlabRequestOptions, HttpMethod } from '../types/request-options.type';

/**
 * Low-level HTTP client for the GitLab REST API.
 * Owns authentication, base URL composition, query serialization and error mapping.
 * All feature services should depend on this rather than calling fetch directly.
 */
@Injectable()
export class GitlabApiService {
  private readonly baseUrl: string;

  private readonly token: string;

  private readonly timeoutMs: number;

  constructor(
    configService: ConfigService<EnvironmentVariables, true>,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = this.normalizeBaseUrl(configService.get('GITLAB_BASE_URL', { infer: true }));
    this.token = configService.get('GITLAB_TOKEN', { infer: true });
    this.timeoutMs = configService.get('GITLAB_TIMEOUT_MS', { infer: true });
  }

  private normalizeBaseUrl(url: string): string {
    const trimmed = url.replace(/\/+$/, '');

    return `${trimmed}/api/v4/`;
  }

  private buildUrl(endpoint: string, query?: GitlabRequestOptions['query']): string {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    const url = new URL(normalizedEndpoint, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }

        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  private mapErrorResponse(
    status: number,
    method: HttpMethod,
    endpoint: string,
    payload: unknown,
  ): BaseException {
    const detail = this.extractErrorMessage(payload) ?? `GitLab request failed (${status})`;
    const context = `${method} ${endpoint}`;

    if (status === 401 || status === 403) {
      return new UnauthorizedException(`${context}: ${detail}`, payload);
    }

    if (status === 404) {
      return new NotFoundException(`${context}: ${detail}`, payload);
    }

    if (status >= 400 && status < 500) {
      return new BadRequestException(`${context}: ${detail}`, payload);
    }

    return new InternalServerErrorException(`${context}: ${detail}`, payload);
  }

  private extractErrorMessage(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (typeof record.error === 'string') {
      return record.error;
    }

    if (typeof record.error_description === 'string') {
      return record.error_description;
    }

    return undefined;
  }

  async request<TResponse>(
    method: HttpMethod,
    endpoint: string,
    options?: GitlabRequestOptions,
  ): Promise<TResponse> {
    const url = this.buildUrl(endpoint, options?.query);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'PRIVATE-TOKEN': this.token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    };

    if (options?.body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    this.logger.debug(`-> ${method} ${url}`);

    let response: Response;

    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError')
      ) {
        throw new InternalServerErrorException(
          `GitLab request timed out after ${this.timeoutMs}ms: ${method} ${endpoint}`,
        );
      }

      if (error instanceof TypeError) {
        throw new InternalServerErrorException(
          `Unable to reach GitLab at ${this.baseUrl}: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        `Unexpected GitLab request failure: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const rawBody = await response.text();
    const parsedBody = this.safeParseJson(rawBody);

    if (!response.ok) {
      this.logger.warn(`<- ${response.status} ${method} ${endpoint}`);

      throw this.mapErrorResponse(response.status, method, endpoint, parsedBody ?? rawBody);
    }

    return (parsedBody ?? null) as TResponse;
  }

  private safeParseJson(raw: string): unknown {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
