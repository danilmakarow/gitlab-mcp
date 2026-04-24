import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

import { BranchesService } from '@modules/gitlab/services/branches.service';

import { errorResponse, jsonResponse, McpToolResponse } from '../utils/mcp-response.util';

const listBranchesSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  search: z.string().optional().describe('Filter branches by name substring.'),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

@Injectable()
export class BranchesTool {
  constructor(private readonly branchesService: BranchesService) {}

  @Tool({
    name: 'gitlab_list_branches',
    description: 'List repository branches for a given GitLab project.',
    parameters: listBranchesSchema,
  })
  async listBranches(input: z.infer<typeof listBranchesSchema>): Promise<McpToolResponse> {
    try {
      const branches = await this.branchesService.listBranches(input.projectIdOrPath, input);

      return jsonResponse(branches);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
