export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface GitlabRequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface PaginationOptions {
  page?: number;
  perPage?: number;
}
