DROP TABLE `assessments`;--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `prerequisites`;--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `learning_objectives`;--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `is_required`;--> statement-breakpoint
ALTER TABLE `lms_user_progress` DROP COLUMN `started_at`;--> statement-breakpoint
ALTER TABLE `lms_user_progress` DROP COLUMN `current_module_id`;--> statement-breakpoint
ALTER TABLE `lms_user_progress` DROP COLUMN `current_lesson_id`;