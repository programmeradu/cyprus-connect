CREATE TABLE `dashboard_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`metric_type` text NOT NULL,
	`current_value` real NOT NULL,
	`previous_value` real NOT NULL,
	`trend_percentage` real NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `historical_emissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`electricity_kwh` real NOT NULL,
	`gas_m3` real NOT NULL,
	`water_liters` real NOT NULL,
	`waste_kg` real NOT NULL,
	`transport_km` real NOT NULL,
	`total_co2e` real NOT NULL,
	`renewable_percentage` real NOT NULL,
	`efficiency_score` real NOT NULL,
	`waste_diversion_rate` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `industry_comparisons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`industry` text NOT NULL,
	`metric_type` text NOT NULL,
	`average_value` real NOT NULL,
	`top_quartile_value` real NOT NULL,
	`bottom_quartile_value` real NOT NULL,
	`unit` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sustainability_goals_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`goal_type` text NOT NULL,
	`target_value` real NOT NULL,
	`current_value` real NOT NULL,
	`target_year` integer NOT NULL,
	`progress_percentage` real NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
