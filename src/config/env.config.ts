import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

/**
 * Parses a comma-separated env var into a trimmed, non-empty string array.
 */
const commaSeparatedList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0),
);

/**
 * Schema definition for environment variables using Zod.
 * Validates and enforces the structure of environment variables required by the MCP server.
 */
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Public base URL of the deployed MCP server — used as JWT audience/issuer and in OAuth metadata.
  PUBLIC_BASE_URL: z.string().url(),

  // GitLab API
  GITLAB_BASE_URL: z.string().url(),
  GITLAB_TOKEN: z.string().min(1),
  GITLAB_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // OAuth — GitHub identity provider
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // Comma-separated GitHub usernames allowed to access the MCP server.
  GITHUB_USERNAMES_ALLOWLIST: commaSeparatedList,

  // Secret used to sign JWT access/refresh tokens issued by our OAuth server.
  JWT_SECRET: z.string().min(32),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

/**
 * Validates the provided configuration object against the environment schema.
 * Throws a descriptive error if validation fails.
 */
export const validateEnvs = (config: Record<string, unknown>): EnvironmentVariables => {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Environment validation failed: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`,
    );
  }

  return result.data;
};

/**
 * Returns the globally registered ConfigModule wired with env validation.
 */
export const getConfigModule = () =>
  ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnvs,
    envFilePath: ['.env.local', '.env'],
  });
