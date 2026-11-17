-- Notification-email retry metadata (P0-02). Optional during rollout: the
-- contact/admin/automation workers fall back to the 0004 status columns when
-- this migration has not been applied yet.
ALTER TABLE `inquiry` ADD COLUMN `email_attempts` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `email_last_attempt_at` integer;--> statement-breakpoint
ALTER TABLE `inquiry` ADD COLUMN `email_message_id` text;
