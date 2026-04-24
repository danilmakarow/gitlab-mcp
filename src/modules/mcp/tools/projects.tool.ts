import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

import { ProjectsService } from '../../gitlab/services/projects.service';
import { errorResponse, jsonResponse, McpToolResponse } from '../utils/mcp-response.util';

const listProjectsSchema = z.object({
  search: z.string().optional().describe('Free-text search across project names.'),
  membership: z
    .boolean()
    .optional()
    .describe('Limit to projects the current user belongs to. Defaults to true.'),
  owned: z.boolean().optional().describe('Limit to projects explicitly owned by the user.'),
  archived: z.boolean().optional().describe('Include archived projects.'),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

const listGroupProjectsSchema = listProjectsSchema.extend({
  groupIdOrPath: z.string().describe('Group numeric ID or full path (e.g. "acme/platform").'),
  includeSubgroups: z.boolean().optional(),
});

const getProjectSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
});

@Injectable()
export class ProjectsTool {
  constructor(private readonly projectsService: ProjectsService) {}

  @Tool({
    name: 'gitlab_list_projects',
    description:
      'List GitLab projects (repositories) visible to the authenticated user. ' +
      'Supports text search and pagination. Defaults to membership=true.',
    parameters: listProjectsSchema,
  })
  async listProjects(input: z.infer<typeof listProjectsSchema>): Promise<McpToolResponse> {
    try {
      const projects = await this.projectsService.listProjects(input);

      return jsonResponse(projects);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_list_group_projects',
    description:
      'List GitLab projects within a group (by ID or full path). ' +
      'Useful when the agent already knows the group and wants the full project list, including subgroups by default.',
    parameters: listGroupProjectsSchema,
  })
  async listGroupProjects(
    input: z.infer<typeof listGroupProjectsSchema>,
  ): Promise<McpToolResponse> {
    try {
      const projects = await this.projectsService.listGroupProjects(input.groupIdOrPath, input);

      return jsonResponse(projects);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_get_project',
    description: 'Fetch a single project by numeric ID or full path.',
    parameters: getProjectSchema,
  })
  async getProject(input: z.infer<typeof getProjectSchema>): Promise<McpToolResponse> {
    try {
      const project = await this.projectsService.getProject(input.projectIdOrPath);

      return jsonResponse(project);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
