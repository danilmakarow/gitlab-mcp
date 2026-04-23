import { Injectable } from '@nestjs/common';

import { GitlabApiService } from './gitlab-api.service';
import {
  GitlabMergeRequest,
  GitlabMergeRequestState,
  GitlabNote,
} from '@/modules/gitlab/types/gitlab-entities.type';
import { PaginationOptions } from '@/modules/gitlab/types/request-options.type';
import { encodeProjectId } from '@/modules/gitlab/utils/encode-project-id.util';

export interface ListMergeRequestsOptions extends PaginationOptions {
  state?: GitlabMergeRequestState | 'all';
  search?: string;
  authorUsername?: string;
  reviewerUsername?: string;
  targetBranch?: string;
  sourceBranch?: string;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  sort?: 'asc' | 'desc';
}

export interface UpdateMergeRequestInput {
  title?: string;
  description?: string;
  targetBranch?: string;
  stateEvent?: 'close' | 'reopen';
  assigneeIds?: number[];
  reviewerIds?: number[];
  labels?: string[];
  addLabels?: string[];
  removeLabels?: string[];
  draft?: boolean;
}

export interface ListMergeRequestNotesOptions extends PaginationOptions {
  sort?: 'asc' | 'desc';
  orderBy?: 'created_at' | 'updated_at';
}

@Injectable()
export class MergeRequestsService {
  constructor(private readonly api: GitlabApiService) {}

  /**
   * Lists merge requests for a project, with standard GitLab filters.
   */
  listMergeRequests(
    projectIdOrPath: string | number,
    options?: ListMergeRequestsOptions,
  ): Promise<GitlabMergeRequest[]> {
    return this.api.request<GitlabMergeRequest[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/merge_requests`,
      {
        query: {
          state: options?.state ?? 'opened',
          search: options?.search,
          author_username: options?.authorUsername,
          reviewer_username: options?.reviewerUsername,
          target_branch: options?.targetBranch,
          source_branch: options?.sourceBranch,
          order_by: options?.orderBy ?? 'updated_at',
          sort: options?.sort ?? 'desc',
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      },
    );
  }

  /**
   * Fetches a single merge request by its project-scoped IID.
   */
  getMergeRequest(
    projectIdOrPath: string | number,
    mergeRequestIid: number,
  ): Promise<GitlabMergeRequest> {
    return this.api.request<GitlabMergeRequest>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/merge_requests/${mergeRequestIid}`,
    );
  }

  /**
   * Updates the metadata of a merge request (title, description, state, assignees, labels, etc.).
   */
  updateMergeRequest(
    projectIdOrPath: string | number,
    mergeRequestIid: number,
    input: UpdateMergeRequestInput,
  ): Promise<GitlabMergeRequest> {
    return this.api.request<GitlabMergeRequest>(
      'PUT',
      `projects/${encodeProjectId(projectIdOrPath)}/merge_requests/${mergeRequestIid}`,
      {
        body: {
          title: input.title,
          description: input.description,
          target_branch: input.targetBranch,
          state_event: input.stateEvent,
          assignee_ids: input.assigneeIds,
          reviewer_ids: input.reviewerIds,
          labels: input.labels?.join(','),
          add_labels: input.addLabels?.join(','),
          remove_labels: input.removeLabels?.join(','),
          discussion_locked: undefined,
          draft: input.draft,
        },
      },
    );
  }

  /**
   * Lists notes (comments) on a merge request.
   */
  listMergeRequestNotes(
    projectIdOrPath: string | number,
    mergeRequestIid: number,
    options?: ListMergeRequestNotesOptions,
  ): Promise<GitlabNote[]> {
    return this.api.request<GitlabNote[]>(
      'GET',
      `projects/${encodeProjectId(projectIdOrPath)}/merge_requests/${mergeRequestIid}/notes`,
      {
        query: {
          sort: options?.sort ?? 'asc',
          order_by: options?.orderBy ?? 'created_at',
          per_page: options?.perPage ?? 50,
          page: options?.page ?? 1,
        },
      },
    );
  }

  /**
   * Posts a new note (comment) on a merge request.
   */
  createMergeRequestNote(
    projectIdOrPath: string | number,
    mergeRequestIid: number,
    body: string,
  ): Promise<GitlabNote> {
    return this.api.request<GitlabNote>(
      'POST',
      `projects/${encodeProjectId(projectIdOrPath)}/merge_requests/${mergeRequestIid}/notes`,
      {
        body: { body },
      },
    );
  }
}
