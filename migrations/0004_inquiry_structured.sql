-- Structured inquiry fields + notification-email delivery status.
-- The contact worker falls back to the legacy column set when these are not
-- present yet, so this migration is safe to apply after the Worker deploy.
ALTER TABLE `inquiry` ADD COLUMN `submission_key` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `buyer_type` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `product_type` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `product_interest` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `source_url` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `referrer` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `utm_source` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `utm_medium` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `utm_campaign` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `utm_term` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `utm_content` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `email_status` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `email_error` text;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `email_sent_at` integer;
