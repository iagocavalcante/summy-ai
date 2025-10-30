CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"total_cost" double precision DEFAULT 0 NOT NULL,
	"avg_duration" double precision,
	"gemini_requests" integer DEFAULT 0 NOT NULL,
	"openai_requests" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "summarization_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"original_text" text NOT NULL,
	"summary" text,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"llm_provider" text NOT NULL,
	"tokens_input" integer,
	"tokens_output" integer,
	"cost_estimate" double precision,
	"duration" integer,
	"error_message" text,
	"user_id" text,
	"request_ip" text,
	"count_requests" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "date_idx" ON "analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "status_idx" ON "summarization_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "summarization_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_provider_idx" ON "summarization_requests" USING btree ("llm_provider");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "summarization_requests" USING btree ("user_id");
