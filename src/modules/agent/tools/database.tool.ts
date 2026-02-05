import { DynamicStructuredTool } from '@langchain/core/tools';
import { DataSource } from 'typeorm';
import { z } from 'zod';

export const createDatabaseQueryTool = (dataSource: DataSource) => {
  return new DynamicStructuredTool({
    name: 'query_database',
    description:
      'Execute a read-only SQL query against the PostgreSQL database. Use this to answer questions involving data.',
    schema: z.object({
      query: z
        .string()
        .describe('The SQL query to execute. Must be a SELECT statement.'),
    }),
    func: async ({ query }) => {
      try {
        if (!query.trim().toLowerCase().startsWith('select')) {
          return 'Error: Only SELECT queries are allowed for safety.';
        }
        const result = await dataSource.query(query);
        return JSON.stringify(result);
      } catch (error) {
        return `Error executing query: ${error.message}`;
      }
    },
  });
};

export const createDatabaseSchemaTool = (dataSource: DataSource) => {
  return new DynamicStructuredTool({
    name: 'get_database_schema',
    description:
      'Get the list of tables and their columns in the database. Use this before querying to know the table names.',
    schema: z.object({}),
    func: async () => {
      try {
        const query = `
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `;
        const result = await dataSource.query(query);

        const schema: Record<string, string[]> = {};
        for (const row of result) {
          if (!schema[row.table_name]) {
            schema[row.table_name] = [];
          }
          schema[row.table_name].push(`${row.column_name} (${row.data_type})`);
        }
        return JSON.stringify(schema, null, 2);
      } catch (error) {
        return `Error getting schema: ${error.message}`;
      }
    },
  });
};
