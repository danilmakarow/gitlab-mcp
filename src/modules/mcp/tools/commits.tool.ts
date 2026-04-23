import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

import { CommitsService } from '@/modules/gitlab/services/commits.service';
import {
  errorResponse,
  jsonResponse,
  McpToolResponse,
} from '@/modules/mcp/utils/mcp-response.util';

const listCommitsSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  refName: z
    .string()
    .optional()
    .describe('Branch, tag, or SHA. Defaults to the project default branch.'),
  since: z.string().optional().describe('ISO-8601 lower bound (inclusive).'),
  until: z.string().optional().describe('ISO-8601 upper bound (inclusive).'),
  path: z.string().optional().describe('Limit to commits touching this path.'),
  author: z.string().optional().describe('Filter by author name or email substring.'),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

@Injectable()
export class CommitsTool {
  constructor(private readonly commitsService: CommitsService) {}

  @Tool({
    name: 'gitlab_list_commits',
    description:
      'List commits for a project. Supports filtering by ref, path, author and date range.',
    parameters: listCommitsSchema,
  })
  async listCommits(input: z.infer<typeof listCommitsSchema>): Promise<McpToolResponse> {
    try {
      const commits = await this.commitsService.listCommits(input.projectIdOrPath, input);

      return jsonResponse(commits);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
