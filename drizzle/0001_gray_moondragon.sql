CREATE TABLE `team_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`token` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invites_token_unique` ON `team_invites` (`token`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `id_token` text;--> statement-breakpoint
ALTER TABLE `teams` ADD `program` text DEFAULT 'ftc' NOT NULL;