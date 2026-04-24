import { Injectable } from '@nestjs/common';

import { GitlabApiService } from './gitlab-api.service';
import { GitlabProject } from '../types/gitlab-entities.type';
import { PaginationOptions } from '../types/request-options.type';
import { encodeProjectId } from '../utils/encode-project-id.util';

export interface ListProjectsOptions extends PaginationOptions {
  search?: string;
  membership?: boolean;
  owned?: boolean;
  archived?: boolean;
  orderBy?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
  sort?: 'asc' | 'desc';
}

export interface ListGroupProjectsOptions extends ListProjectsOptions {
  includeSubgroups?: boolean;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly api: GitlabApiService) {}

  /**
   * Lists projects visible to the authenticated user.
   * Defaults to `membership=true` so the agent sees only projects the caller belongs to.
   */
  listProjects(options?: ListProjectsOptions): Promise<GitlabProject[]> {
    return this.api.request<GitlabProject[]>('GET', 'projects', {
      query: {
        membership: options?.membership ?? true,
        owned: options?.owned,
        archived: options?.archived,
        search: options?.search,
        order_by: options?.orderBy ?? 'last_activity_at',
        sort: options?.sort ?? 'desc',
        per_page: options?.perPage ?? 20,
        page: options?.page ?? 1,
      },
    });
  }

  /**
   * Lists projects within a specific group (or subgroup) by ID or full path.
   */
  listGroupProjects(
    groupIdOrPath: string | number,
    options?: ListGroupProjectsOptions,
  ): Promise<GitlabProject[]> {
    const groupSegment = encodeProjectId(groupIdOrPath);

    return this.api.request<GitlabProject[]>('GET', `groups/${groupSegment}/projects`, {
      query: {
        include_subgroups: options?.includeSubgroups ?? true,
        archived: options?.archived,
        search: options?.search,
        order_by: options?.orderBy ?? 'last_activity_at',
        sort: options?.sort ?? 'desc',
        per_page: options?.perPage ?? 20,
        page: options?.page ?? 1,
      },
    });
  }

  /**
   * Fetches a single project by ID or full path.
   */
  getProject(projectIdOrPath: string | number): Promise<GitlabProject> {
    return this.api.request<GitlabProject>('GET', `projects/${encodeProjectId(projectIdOrPath)}`);
  }
}
