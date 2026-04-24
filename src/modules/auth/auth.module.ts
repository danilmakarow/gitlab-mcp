import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubOAuthProvider, McpAuthModule } from '@rekog/mcp-nest';

import { EnvironmentVariables, getConfigModule } from '@config/env.config';

import { AllowlistGuard } from './guards/allowlist.guard';

getConfigModule();

/**
 * Wires the built-in MCP OAuth authorization server using GitHub as the
 * identity provider. Exposes DCR (`/register`), metadata discovery, the
 * authorize/token/callback endpoints, and the JWT access token issuer.
 *
 * The allowlist guard runs on `/mcp` only — see `McpModule` options.
 */
@Module({
  imports: [
    McpAuthModule.forRoot({
      provider: GitHubOAuthProvider,
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      jwtSecret: process.env.JWT_SECRET ?? '',
      serverUrl: process.env.PUBLIC_BASE_URL,
      resource: process.env.PUBLIC_BASE_URL,
      jwtAudience: process.env.PUBLIC_BASE_URL,
      jwtIssuer: process.env.PUBLIC_BASE_URL,
      jwtAccessTokenExpiresIn: '24h',
      enableRefreshTokens: false,
      storeConfiguration: { type: 'memory' },
      cookieSecure: process.env.NODE_ENV === 'production',
    }),
  ],
  providers: [AllowlistGuard],
  exports: [AllowlistGuard],
})
export class AuthModule {
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this.verifyOAuthEnvConfig(configService);
  }

  /**
   * Re-validates the OAuth env vars at module construction time.
   * `McpAuthModule.forRoot` reads from `process.env` directly, which bypasses our
   * Zod schema — this check ensures we fail fast if a required value is missing.
   */
  private verifyOAuthEnvConfig(configService: ConfigService<EnvironmentVariables, true>): void {
    configService.get('GITHUB_CLIENT_ID', { infer: true });
    configService.get('GITHUB_CLIENT_SECRET', { infer: true });
    configService.get('JWT_SECRET', { infer: true });
    configService.get('PUBLIC_BASE_URL', { infer: true });
  }
}
