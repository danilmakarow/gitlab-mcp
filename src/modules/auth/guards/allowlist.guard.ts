import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { McpRequestWithUser } from '@rekog/mcp-nest';

import { UnauthorizedException } from '@common/exceptions/index';
import { EnvironmentVariables } from '@config/env.config';
import { AppLogger } from '@modules/logger/app-logger';

/**
 * Authorizes MCP requests by checking the authenticated GitHub username against
 * the `GITHUB_USERNAMES_ALLOWLIST` env var. Runs after `McpAuthJwtGuard`, which
 * has already validated the JWT and attached `request.user`.
 *
 * Does not protect OAuth endpoints (/register, /authorize, /token, /callback) —
 * those routes are owned by `McpAuthModule` and must stay publicly accessible.
 */
@Injectable()
export class AllowlistGuard implements CanActivate {
  private readonly allowlist: Set<string>;

  constructor(
    configService: ConfigService<EnvironmentVariables, true>,
    private readonly logger: AppLogger,
  ) {
    const usernames = configService.get('GITHUB_USERNAMES_ALLOWLIST', { infer: true });

    this.allowlist = new Set(usernames.map((username) => username.toLowerCase()));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<McpRequestWithUser>();
    const username = request.user?.username?.toLowerCase();

    if (!username) {
      this.logger.warn('Allowlist guard: request reached MCP without a resolved username.');

      throw new UnauthorizedException('Authenticated user not resolved.');
    }

    if (!this.allowlist.has(username)) {
      this.logger.warn(`Allowlist guard: rejected GitHub user "${username}".`);

      throw new UnauthorizedException(
        `GitHub user "${username}" is not permitted to access this MCP server.`,
      );
    }

    return true;
  }
}
