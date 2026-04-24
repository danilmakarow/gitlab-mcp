import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

import { PipelinesService } from '@modules/gitlab/services/pipelines.service';

import {
  errorResponse,
  jsonResponse,
  McpToolResponse,
  textResponse,
} from '../utils/mcp-response.util';

const pipelineStatusSchema = z.enum([
  'created',
  'waiting_for_resource',
  'preparing',
  'pending',
  'running',
  'success',
  'failed',
  'canceled',
  'skipped',
  'manual',
  'scheduled',
]);

const listPipelinesSchema = z.object({
  projectIdOrPath: z.string().describe('Project numeric ID or full path.'),
  status: pipelineStatusSchema.optional(),
  ref: z.string().optional().describe('Branch or tag name.'),
  sha: z.string().optional(),
  username: z.string().optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

const pipelineIdentifier = z.object({
  projectIdOrPath: z.string(),
  pipelineId: z.number().int().describe('Global pipeline ID (not IID).'),
});

const listJobsSchema = pipelineIdentifier.extend({
  scope: z.array(pipelineStatusSchema).optional().describe('Filter jobs to only these statuses.'),
  includeRetried: z.boolean().optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

const jobIdentifier = z.object({
  projectIdOrPath: z.string(),
  jobId: z.number().int(),
});

const getJobTraceSchema = jobIdentifier.extend({
  tailLines: z
    .number()
    .int()
    .positive()
    .max(2000)
    .optional()
    .describe('Return only the last N lines of the trace. Useful for failing job diagnosis.'),
});

@Injectable()
export class PipelinesTool {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Tool({
    name: 'gitlab_list_pipelines',
    description:
      'List pipelines for a project. Filter by status, ref, sha, or triggering username.',
    parameters: listPipelinesSchema,
  })
  async listPipelines(input: z.infer<typeof listPipelinesSchema>): Promise<McpToolResponse> {
    try {
      const pipelines = await this.pipelinesService.listPipelines(input.projectIdOrPath, input);

      return jsonResponse(pipelines);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_get_pipeline',
    description: 'Fetch a single pipeline summary by global pipeline ID.',
    parameters: pipelineIdentifier,
  })
  async getPipeline(input: z.infer<typeof pipelineIdentifier>): Promise<McpToolResponse> {
    try {
      const pipeline = await this.pipelinesService.getPipeline(
        input.projectIdOrPath,
        input.pipelineId,
      );

      return jsonResponse(pipeline);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_list_pipeline_jobs',
    description: 'List jobs belonging to a pipeline, with optional status scoping.',
    parameters: listJobsSchema,
  })
  async listPipelineJobs(input: z.infer<typeof listJobsSchema>): Promise<McpToolResponse> {
    try {
      const jobs = await this.pipelinesService.listPipelineJobs(
        input.projectIdOrPath,
        input.pipelineId,
        input,
      );

      return jsonResponse(jobs);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_get_job',
    description: 'Fetch a single job summary.',
    parameters: jobIdentifier,
  })
  async getJob(input: z.infer<typeof jobIdentifier>): Promise<McpToolResponse> {
    try {
      const job = await this.pipelinesService.getJob(input.projectIdOrPath, input.jobId);

      return jsonResponse(job);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Tool({
    name: 'gitlab_get_job_trace',
    description:
      'Fetch the raw log (trace) of a job. Pass tailLines to return only the last N lines — ' +
      'recommended for diagnosing failures in long logs.',
    parameters: getJobTraceSchema,
  })
  async getJobTrace(input: z.infer<typeof getJobTraceSchema>): Promise<McpToolResponse> {
    try {
      const trace = await this.pipelinesService.getJobTrace(input.projectIdOrPath, input.jobId);

      if (!input.tailLines) {
        return textResponse(trace);
      }

      const lines = trace.split('\n');
      const tail = lines.slice(-input.tailLines).join('\n');

      return textResponse(tail);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
