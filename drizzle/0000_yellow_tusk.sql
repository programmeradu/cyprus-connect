CREATE TABLE `emissions_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`value` real NOT NULL,
	`emissions` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `green_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`impact` text NOT NULL,
	`credits` integer NOT NULL,
	`order_index` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text NOT NULL,
	`credits` integer NOT NULL,
	`rank` integer NOT NULL,
	`is_demo_user` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sustainability_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`trend` text NOT NULL,
	`trend_value` real NOT NULL,
	`color` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`green_credits` integer DEFAULT 0 NOT NULL,
	`leaderboard_rank` integer NOT NULL,
	`completed_action_ids` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_progress_user_id_unique` ON `user_progress` (`user_id`);