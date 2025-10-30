ALTER TABLE "summarization_requests" ADD COLUMN "request_ip" text;--> statement-breakpoint
ALTER TABLE "summarization_requests" ADD COLUMN "count_requests" integer DEFAULT 0 NOT NULL;