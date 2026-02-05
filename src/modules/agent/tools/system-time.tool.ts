import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const systemTimeTool = new DynamicStructuredTool({
  name: 'get_system_time',
  description:
    'Returns the current system time. Use this when the user asks for the time.',
  schema: z.object({}),
  func: async () => {
    return new Date().toISOString();
  },
});
