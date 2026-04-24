import { Injectable } from '@nestjs/common';

import { GitlabApiService } from './gitlab-api.service';
import { GitlabCommit } from '../types/gitlab-entities.type';
import { PaginationOptions } from '../types/request-options.type';
import { encodeProjectId } from '../utils/encode-project-id.util';

export interface ListCommitsOptions extends PaginationOptions {
  refName?: string;
  since?: string;
  until?: string;
  path?: string;
  author?: string;
}

@Injectable()
export class CommitsService {
  constructor(private readonly api: GitlabApiService) {}

  /**
   * Lists commits for a project, optionally filtered by ref, path, author, or date range.
   */
  listCommits(
    projectIdOrPath: string | number,
    options?: ListCommitsOptions,
  ): Promise<GitlabCommit[]> {
    return this.api.request<GitlabCommit[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/repository/commits`,
      {
        query: {
          ref_name: options?.refName,
          since: options?.since,
          until: options?.until,
          path: options?.path,
          author: options?.author,
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      },
    );
  }
}
