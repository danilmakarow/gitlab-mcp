import { BaseException } from '@/exceptions/index';

interface McpTextContent {
  type: 'text';
  text: string;
}

export interface McpToolResponse {
  content: McpTextContent[];
  isError?: boolean;
}

/**
 * Wraps arbitrary JSON-serialisable data into the MCP text-content envelope.
 * Pretty-prints so agents can read the payload directly.
 */
export const jsonResponse = (data: unknown): McpToolResponse => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

/**
 * Wraps a plain-text value into the MCP text-content envelope (used for job traces etc.).
 */
export const textResponse = (text: string): McpToolResponse => ({
  content: [{ type: 'text', text }],
});

/**
 * Normalises errors from tool handlers into an MCP error response so the agent
 * sees a readable message instead of the transport failing.
 */
export const errorResponse = (error: unknown): McpToolResponse => {
  if (error instanceof BaseException) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              code: error.code,
              status: error.status,
              message: error.message,
              payload: error.payload,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const message = error instanceof Error ? error.message : String(error);

  return {
    isError: true,
    content: [{ type: 'text', text: `Unexpected error: ${message}` }],
  };
};
