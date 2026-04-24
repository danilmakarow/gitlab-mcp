import { Injectable } from '@nestjs/common';

import { GitlabApiService } from './gitlab-api.service';
import { GitlabBranch } from '../types/gitlab-entities.type';
import { PaginationOptions } from '../types/request-options.type';
import { encodeProjectId } from '../utils/encode-project-id.util';

export interface ListBranchesOptions extends PaginationOptions {
  search?: string;
}

@Injectable()
export class BranchesService {
  constructor(private readonly api: GitlabApiService) {}

  /**
   * Lists repository branches for a given project. Supports search and pagination.
   */
  listBranches(
    projectIdOrPath: string | number,
    options?: ListBranchesOptions,
  ): Promise<GitlabBranch[]> {
    return this.api.request<GitlabBranch[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/repository/branches`,
      {
        query: {
          search: options?.search,
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      },
    );
  }
}
