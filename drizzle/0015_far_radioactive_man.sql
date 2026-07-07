CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`questions_json` text NOT NULL,
	`passing_score` integer NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `courses` ADD `prerequisites` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `learning_objectives` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `created_by` text NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `lessons` ADD `is_required` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `started_at` text;--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `current_module_id` integer;--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `current_lesson_id` integer;