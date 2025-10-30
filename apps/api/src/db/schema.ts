import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// Enum for request status
export const requestStatusEnum = pgEnum('request_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

// SummarizationRequest table
export const summarizationRequests = pgTable(
  'summarization_requests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    originalText: text('original_text').notNull(),
    summary: text('summary'),
    status: requestStatusEnum('status').default('PENDING').notNull(),
    llmProvider: text('llm_provider').notNull(),
    tokensInput: integer('tokens_input'),
    tokensOutput: integer('tokens_output'),
    costEstimate: doublePrecision('cost_estimate'),
    duration: integer('duration'),
    errorMessage: text('error_message'),
    userId: text('user_id'),
    requestIp: text('request_ip'),
    countRequests: integer('count_requests').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index('status_idx').on(table.status),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
    llmProviderIdx: index('llm_provider_idx').on(table.llmProvider),
    userIdIdx: index('user_id_idx').on(table.userId),
  }),
);

// Analytics table
export const analytics = pgTable(
  'analytics',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: timestamp('date').defaultNow().notNull().unique(),
    totalRequests: integer('total_requests').default(0).notNull(),
    successfulRequests: integer('successful_requests').default(0).notNull(),
    failedRequests: integer('failed_requests').default(0).notNull(),
    totalTokensUsed: integer('total_tokens_used').default(0).notNull(),
    totalCost: doublePrecision('total_cost').default(0).notNull(),
    avgDuration: doublePrecision('avg_duration'),
    geminiRequests: integer('gemini_requests').default(0).notNull(),
    openaiRequests: integer('openai_requests').default(0).notNull(),
  },
  (table) => ({
    dateIdx: index('date_idx').on(table.date),
  }),
);

// Types for TypeScript
export type SummarizationRequest = typeof summarizationRequests.$inferSelect;
export type NewSummarizationRequest = typeof summarizationRequests.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;
