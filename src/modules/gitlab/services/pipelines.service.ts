import { Injectable } from '@nestjs/common';

import { GitlabApiService } from './gitlab-api.service';
import {
  GitlabJob,
  GitlabPipeline,
  GitlabPipelineStatus,
} from '../types/gitlab-entities.type';
import { PaginationOptions } from '../types/request-options.type';
import { encodeProjectId } from '../utils/encode-project-id.util';

export interface ListPipelinesOptions extends PaginationOptions {
  status?: GitlabPipelineStatus;
  ref?: string;
  sha?: string;
  username?: string;
  orderBy?: 'id' | 'status' | 'ref' | 'updated_at' | 'user_id';
  sort?: 'asc' | 'desc';
}

export interface ListJobsOptions extends PaginationOptions {
  scope?: Array<GitlabPipelineStatus>;
  includeRetried?: boolean;
}

@Injectable()
export class PipelinesService {
  constructor(private readonly api: GitlabApiService) {}

  /**
   * Lists pipelines for a project, optionally filtered by status, ref, or sha.
   */
  listPipelines(
    projectIdOrPath: string | number,
    options?: ListPipelinesOptions,
  ): Promise<GitlabPipeline[]> {
    return this.api.request<GitlabPipeline[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/pipelines`,
      {
        query: {
          status: options?.status,
          ref: options?.ref,
          sha: options?.sha,
          username: options?.username,
          order_by: options?.orderBy ?? 'updated_at',
          sort: options?.sort ?? 'desc',
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      },
    );
  }

  /**
   * Fetches a single pipeline by ID, including status summary.
   */
  getPipeline(projectIdOrPath: string | number, pipelineId: number): Promise<GitlabPipeline> {
    return this.api.request<GitlabPipeline>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/pipelines/${pipelineId}`,
    );
  }

  /**
   * Lists jobs for a given pipeline. `scope` narrows to specific statuses.
   */
  listPipelineJobs(
    projectIdOrPath: string | number,
    pipelineId: number,
    options?: ListJobsOptions,
  ): Promise<GitlabJob[]> {
    const query: Record<string, string | number | boolean | undefined> = {
      include_retried: options?.includeRetried ?? false,
      per_page: options?.perPage ?? 50,
      page: options?.page ?? 1,
    };

    if (options?.scope?.length) {
      query.scope = options.scope.join(',');
    }

    return this.api.request<GitlabJob[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/pipelines/${pipelineId}/jobs`,
      { query },
    );
  }

  /**
   * Fetches a single job by ID.
   */
  getJob(projectIdOrPath: string | number, jobId: number): Promise<GitlabJob> {
    return this.api.request<GitlabJob>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/jobs/${jobId}`,
    );
  }

  /**
   * Fetches the trace (log) of a job as plain text. Truncates long output in MCP tools.
   */
  async getJobTrace(projectIdOrPath: string | number, jobId: number): Promise<string> {
    const raw = await this.api.request<string>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/jobs/${jobId}/trace`,
      { headers: { Accept: 'text/plain' } },
    );

    return typeof raw === 'string' ? raw : '';
  }
}
