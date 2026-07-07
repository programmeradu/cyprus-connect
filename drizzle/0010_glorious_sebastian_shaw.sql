CREATE TABLE `media_generations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`prompt` text NOT NULL,
	`enhanced_prompt` text,
	`model` text,
	`model_reason` text,
	`context_type` text,
	`aspect_ratio` text,
	`edited` integer DEFAULT false NOT NULL,
	`edit_parameters` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
