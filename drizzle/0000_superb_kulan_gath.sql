CREATE TABLE `catalog_page_items` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`slot_key` text NOT NULL,
	`erp_product_gid_numer` integer NOT NULL,
	`erp_product_gid_typ` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`custom_data` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `catalog_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `catalog_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`catalog_id` text NOT NULL,
	`page_type` text NOT NULL,
	`template_code` text NOT NULL,
	`sort_order` integer NOT NULL,
	`manufacturer_ref` text,
	`configuration` text DEFAULT '{}' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`catalog_id`) REFERENCES `catalogs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `catalog_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalogs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`valid_from` text,
	`valid_to` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`phone` text,
	`email` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `manufacturer_presentations` (
	`id` text PRIMARY KEY NOT NULL,
	`erp_reference` text NOT NULL,
	`display_name` text NOT NULL,
	`logo_asset_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`catalog_enabled` integer DEFAULT true NOT NULL,
	`default_template` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manufacturer_presentations_erp_reference_unique` ON `manufacturer_presentations` (`erp_reference`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`path` text NOT NULL,
	`width` integer,
	`height` integer,
	`file_size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `page_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`page_type` text NOT NULL,
	`slots` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_templates_code_unique` ON `page_templates` (`code`);--> statement-breakpoint
CREATE TABLE `product_presentations` (
	`id` text PRIMARY KEY NOT NULL,
	`erp_gid_numer` integer NOT NULL,
	`erp_gid_typ` integer NOT NULL,
	`custom_image_asset_id` text,
	`custom_marketing_name` text,
	`custom_description` text,
	`hidden_in_catalog` integer DEFAULT false NOT NULL,
	`preferred_template` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_presentation_erp_id` ON `product_presentations` (`erp_gid_numer`,`erp_gid_typ`);--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`label` text NOT NULL,
	`svg` text NOT NULL,
	`created_at` text NOT NULL
);
