import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

import { MergeRequestsService } from '@modules/gitlab/services/merge-requests.service';

import { errorResponse, jsonResponse, McpToolResponse } from '../utils/mcp-response.util';

const mergeRequestStateSchema = z.enum(['opened', 'closed', 'locked', 'merged', 'all']);

const listMergeRequestsSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  state: mergeRequestStateSchema.optional().describe('Defaults to "opened".'),
  search: z.string().optional(),
  authorUsername: z.string().optional(),
  reviewerUsername: z.string().optional(),
  targetBranch: z.string().optional(),
  sourceBranch: z.string().optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

const createMergeRequestSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  sourceBranch: z.string().describe('Branch containing the changes to merge.'),
  targetBranch: z.string().describe('Branch to merge into.'),
  title: z.string().min(1).describe('Merge request title. Prefix with "Draft:" to open as draft.'),
  description: z.string().optional(),
  assigneeIds: z.array(z.number().int()).optional(),
  reviewerIds: z.array(z.number().int()).optional(),
  labels: z.array(z.string()).optional(),
  targetProjectId: z
    .number()
    .int()
    .optional()
    .describe('Target project ID for cross-project MRs (forks).'),
  milestoneId: z.number().int().optional(),
  removeSourceBranch: z.boolean().optional(),
  squash: z.boolean().optional(),
  allowCollaboration: z
    .boolean()
    .optional()
    .describe('Allow maintainers of the target project to push to the source branch.'),
});

const mergeRequestIdentifier = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  mergeRequestIid: z
    .number()
    .int()
    .describe('Project-scoped merge request IID (the number shown in the MR URL).'),
});

const updateMergeRequestSchema = mergeRequestIdentifier.extend({
  title: z.string().optional(),
  description: z.string().optional(),
  targetBranch: z.string().optional(),
  stateEvent: z
    .enum(['close', 'reopen'])
    .optional()
    .describe('Use "close" or "reopen" to change MR state.'),
  assigneeIds: z.array(z.number().int()).optional(),
  reviewerIds: z.array(z.number().int()).optional(),
  labels: z.array(z.string()).optional().describe('Replace the full label set.'),
  addLabels: z.array(z.string()).optional(),
  removeLabels: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});

const listNotesSchema = mergeRequestIdentifier.extend({
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
  sort: z.enum(['asc', 'desc']).optional(),
});

const createNoteSchema = mergeRequestIdentifier.extend({
  body: z.string().min(1).describe('Note body in GitLab-flavoured markdown.'),
});

@Injectable()
export class MergeRequestsTool {
  constructor(private readonly mergeRequestsService: MergeRequestsService) {}

  @Tool({
    name: 'gitlab_list_merge_requests',
    description:
      'List merge requests for a project. Defaults to state="opened". ' +
      'Supports filtering by author, reviewer, branches, and free-text search.',
    parameters: listMergeRequestsSchema,
  })
  async listMergeRequests(
    input: z.infer<typeof listMergeRequestsSchema>,
  ): Promise<McpToolResponse> {
    try {
      const items = await this.mergeRequestsService.listMergeRequests(input.projectIdOrPath, input);

      return jsonResponse(items);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_create_merge_request',
    description:
      'Create a new merge request from sourceBranch into targetBranch. ' +
      'Prefix title with "Draft:" to open it as a draft. ' +
      'Supports assignees, reviewers, labels, squash, and cross-project (fork) targets.',
    parameters: createMergeRequestSchema,
  })
  async createMergeRequest(
    input: z.infer<typeof createMergeRequestSchema>,
  ): Promise<McpToolResponse> {
    try {
      const mr = await this.mergeRequestsService.createMergeRequest(input.projectIdOrPath, input);

      return jsonResponse(mr);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_get_merge_request',
    description: 'Fetch a single merge request with full metadata.',
    parameters: mergeRequestIdentifier,
  })
  async getMergeRequest(input: z.infer<typeof mergeRequestIdentifier>): Promise<McpToolResponse> {
    try {
      const mr = await this.mergeRequestsService.getMergeRequest(
        input.projectIdOrPath,
        input.mergeRequestIid,
      );

      return jsonResponse(mr);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_update_merge_request',
    description:
      'Update a merge request. Supports editing title/description, changing target branch, ' +
      'closing/reopening, adjusting assignees/reviewers, and modifying labels. ' +
      'Only the provided fields are changed.',
    parameters: updateMergeRequestSchema,
  })
  async updateMergeRequest(
    input: z.infer<typeof updateMergeRequestSchema>,
  ): Promise<McpToolResponse> {
    try {
      const mr = await this.mergeRequestsService.updateMergeRequest(
        input.projectIdOrPath,
        input.mergeRequestIid,
        input,
      );

      return jsonResponse(mr);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_list_merge_request_notes',
    description: 'List comments (notes) on a merge request.',
    parameters: listNotesSchema,
  })
  async listNotes(input: z.infer<typeof listNotesSchema>): Promise<McpToolResponse> {
    try {
      const notes = await this.mergeRequestsService.listMergeRequestNotes(
        input.projectIdOrPath,
        input.mergeRequestIid,
        input,
      );

      return jsonResponse(notes);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_create_merge_request_note',
    description: 'Post a new comment on a merge request.',
    parameters: createNoteSchema,
  })
  async createNote(input: z.infer<typeof createNoteSchema>): Promise<McpToolResponse> {
    try {
      const note = await this.mergeRequestsService.createMergeRequestNote(
        input.projectIdOrPath,
        input.mergeRequestIid,
        input.body,
      );

      return jsonResponse(note);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
