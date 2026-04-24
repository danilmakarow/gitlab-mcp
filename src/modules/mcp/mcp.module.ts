import { Module } from '@nestjs/common';
import { McpAuthJwtGuard, McpModule as RekogMcpModule, McpTransportType } from '@rekog/mcp-nest';

import { BranchesTool } from './tools/branches.tool';
import { CommitsTool } from './tools/commits.tool';
import { MergeRequestsTool } from './tools/merge-requests.tool';
import { PipelinesTool } from './tools/pipelines.tool';
import { ProjectsTool } from './tools/projects.tool';
import { AuthModule } from '../auth/auth.module';
import { AllowlistGuard } from '../auth/guards/allowlist.guard';
import { GitlabModule } from '../gitlab/gitlab.module';

/**
 * Registers the MCP server over Streamable HTTP and guards the `/mcp` endpoint
 * with JWT validation (`McpAuthJwtGuard`) followed by GitHub username allowlist
 * enforcement (`AllowlistGuard`). Guard order matters — JWT runs first and
 * attaches `request.user`, the allowlist runs second.
 */
@Module({
  imports: [
    AuthModule,
    GitlabModule,
    RekogMcpModule.forRoot({
      name: 'gitlab-mcp',
      version: '0.1.0',
      transport: McpTransportType.STREAMABLE_HTTP,
      mcpEndpoint: 'mcp',
      guards: [McpAuthJwtGuard, AllowlistGuard],
      streamableHttp: {
        statelessMode: true,
      },
    }),
  ],
  providers: [ProjectsTool, BranchesTool, CommitsTool, MergeRequestsTool, PipelinesTool],
})
export class McpModule {}
