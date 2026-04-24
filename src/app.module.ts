import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module';
import { GitlabModule } from './modules/gitlab/gitlab.module';
import { LoggerModule } from './modules/logger/logger.module';
import { McpModule } from './modules/mcp/mcp.module';
import { getConfigModule } from './config/env.config';

/**
 * Root module. Wires env config, logger, OAuth authorization server,
 * GitLab REST client, and the MCP transport.
 */
@Module({
  imports: [getConfigModule(), LoggerModule, AuthModule, GitlabModule, McpModule],
})
export class AppModule {}
