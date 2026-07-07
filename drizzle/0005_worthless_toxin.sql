DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_credits_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL,
	`action_id` integer,
	`description` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_credits_history`("id", "user_id", "amount", "source", "action_id", "description", "created_at") SELECT "id", "user_id", "amount", "source", "action_id", "description", "created_at" FROM `credits_history`;--> statement-breakpoint
DROP TABLE `credits_history`;--> statement-breakpoint
ALTER TABLE `__new_credits_history` RENAME TO `credits_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_url` text NOT NULL,
	`upload_source` text NOT NULL,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`ocr_text` text,
	`parsed_data` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_documents`("id", "user_id", "file_name", "file_type", "file_size", "file_url", "upload_source", "processing_status", "ocr_text", "parsed_data", "created_at", "updated_at") SELECT "id", "user_id", "file_name", "file_type", "file_size", "file_url", "upload_source", "processing_status", "ocr_text", "parsed_data", "created_at", "updated_at" FROM `documents`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `__new_documents` RENAME TO `documents`;--> statement-breakpoint
CREATE TABLE `__new_emissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`electricity` real NOT NULL,
	`gas` real NOT NULL,
	`water` real NOT NULL,
	`waste` real NOT NULL,
	`transport` real NOT NULL,
	`total_co2e` real NOT NULL,
	`period_month` integer NOT NULL,
	`period_year` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_emissions`("id", "user_id", "electricity", "gas", "water", "waste", "transport", "total_co2e", "period_month", "period_year", "created_at") SELECT "id", "user_id", "electricity", "gas", "water", "waste", "transport", "total_co2e", "period_month", "period_year", "created_at" FROM `emissions`;--> statement-breakpoint
DROP TABLE `emissions`;--> statement-breakpoint
ALTER TABLE `__new_emissions` RENAME TO `emissions`;--> statement-breakpoint
CREATE TABLE `__new_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`integration_type` text NOT NULL,
	`provider_name` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expires_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_sync_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_integrations`("id", "user_id", "integration_type", "provider_name", "access_token", "refresh_token", "token_expires_at", "is_active", "last_sync_at", "created_at", "updated_at") SELECT "id", "user_id", "integration_type", "provider_name", "access_token", "refresh_token", "token_expires_at", "is_active", "last_sync_at", "created_at", "updated_at" FROM `integrations`;--> statement-breakpoint
DROP TABLE `integrations`;--> statement-breakpoint
ALTER TABLE `__new_integrations` RENAME TO `integrations`;--> statement-breakpoint
CREATE TABLE `__new_user_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`action_id` integer NOT NULL,
	`completed_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_actions`("id", "user_id", "action_id", "completed_at", "notes") SELECT "id", "user_id", "action_id", "completed_at", "notes" FROM `user_actions`;--> statement-breakpoint
DROP TABLE `user_actions`;--> statement-breakpoint
ALTER TABLE `__new_user_actions` RENAME TO `user_actions`;--> statement-breakpoint
ALTER TABLE `user` ADD `company_name` text;--> statement-breakpoint
ALTER TABLE `user` ADD `company_industry` text;--> statement-breakpoint
ALTER TABLE `user` ADD `team_size` text;--> statement-breakpoint
ALTER TABLE `user` ADD `sustainability_goals` text;--> statement-breakpoint
ALTER TABLE `user` ADD `total_credits` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_completed` integer DEFAULT false NOT NULL;