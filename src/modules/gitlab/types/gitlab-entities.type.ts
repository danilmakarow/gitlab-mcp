/**
 * Minimal shapes of GitLab REST entities we consume.
 * Not exhaustive — fields are added on demand. Always safe to read extra properties from the raw response.
 */

export interface GitlabUserRef {
  id: number;
  username: string;
  name: string;
  web_url?: string;
}

export interface GitlabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  default_branch: string | null;
  visibility: 'private' | 'internal' | 'public';
  web_url: string;
  last_activity_at: string;
  archived: boolean;
}

export interface GitlabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  web_url: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    author_name: string;
    committed_date: string;
  };
}

export interface GitlabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committed_date: string;
  web_url: string;
}

export type GitlabMergeRequestState = 'opened' | 'closed' | 'locked' | 'merged';

export interface GitlabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: GitlabMergeRequestState;
  source_branch: string;
  target_branch: string;
  author: GitlabUserRef;
  assignees: GitlabUserRef[];
  reviewers: GitlabUserRef[];
  draft: boolean;
  merge_status: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitlabNote {
  id: number;
  body: string;
  author: GitlabUserRef;
  created_at: string;
  updated_at: string;
  system: boolean;
}

export type GitlabPipelineStatus =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled';

export interface GitlabPipeline {
  id: number;
  iid: number;
  project_id: number;
  status: GitlabPipelineStatus;
  source: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitlabJob {
  id: number;
  name: string;
  stage: string;
  status: GitlabPipelineStatus;
  ref: string;
  allow_failure: boolean;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  web_url: string;
  pipeline: { id: number; status: GitlabPipelineStatus; ref: string; sha: string };
}
