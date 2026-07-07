ALTER TABLE `courses` ADD `prerequisites` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `learning_objectives` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `created_by` text NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `updated_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `started_at` text;--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `current_module_id` integer REFERENCES course_modules(id);--> statement-breakpoint
ALTER TABLE `lms_user_progress` ADD `current_lesson_id` integer REFERENCES lessons(id);